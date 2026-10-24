"""
import_service.py

Dataset import: turn a CSV file (or a JSON list of records) into assessments.

  parse_csv()          bytes -> numbered raw rows (+ file-level warnings)
  validate_and_score() raw rows -> per-row results; no database writes
  apply_import()       write every valid row in one transaction, tagged with a batch id
  undo_import()        delete a batch and the cooperatives it created (if now empty)
  template_csv()       downloadable template with one visibly fictional example row

Every row is scored by scoring_service.score_assessment(), the same code path
as POST /assess, so imported numbers can never drift from hand-entered ones.
Row numbers are spreadsheet rows: the header is row 1, the first record row 2.
"""

from __future__ import annotations

import csv
import io
import json
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from pydantic import ValidationError
from sqlalchemy.orm import Session

from benchmark_service import get_options
from db import Assessment, Cooperative
from models import MAX_IMPORT_ROWS, VALID_CAUSES, AssessmentImportRow, ImportRowResult
from scoring_service import ScoringError, score_assessment

MAX_FILE_BYTES = 2 * 1024 * 1024
SAMPLE_PREFIX = "sample cooperative"  # reserved for seed_demo.py's labelled samples


class ImportFileError(ValueError):
    """The file as a whole cannot be read; maps to an HTTP error."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


# ---------------------------------------------------------------------------
# Column reference — drives the template, GET /datasets/import-format and parsing
# ---------------------------------------------------------------------------

_CAUSE_LABELS = {
    "theft": "theft", "insects_pests": "insects and pests", "birds_animals": "birds and animals",
    "stalks_fallen": "stalks fallen before collection", "harvesting_damage": "damage during harvesting",
    "transport": "transport", "storage": "storage", "processing": "processing",
    "packaging": "packaging", "sale": "the point of sale",
}

COLUMNS: List[dict] = [
    {"name": "cooperative_name", "required": True, "type": "text",
     "description": "Cooperative name. Rows with the same name and district go to the same cooperative "
                    "(case and extra spaces are ignored); a new name creates a new cooperative.",
     "example": "Example Cooperative"},
    {"name": "district", "required": True, "type": "text",
     "description": "One of Rwanda's 30 districts, spelled as in GET /options (case is ignored).",
     "example": "Nyagatare"},
    {"name": "crop", "required": True, "type": "text",
     "description": "One of the 21 NISR crop categories, spelled as in GET /options (case is ignored).",
     "example": "Maize"},
    {"name": "season", "required": False, "type": "A, B or C",
     "description": "Agricultural season. Leave empty if unknown (the district benchmark is used).",
     "example": "A"},
    {"name": "year", "required": False, "type": "whole number",
     "description": "Harvest year, e.g. 2025. Used to show the cooperative's history in the right order.",
     "example": "2025"},
    {"name": "harvested_qty_kg", "required": True, "type": "number",
     "description": "Total quantity harvested, in kg. Must be greater than 0.",
     "example": "1000"},
    {"name": "total_loss_kg", "required": False, "type": "number",
     "description": "Total quantity lost, in kg. Required unless you fill in the loss_..._kg columns.",
     "example": "120"},
] + [
    {"name": f"loss_{cause}_kg", "required": False, "type": "number",
     "description": f"Kg lost to {_CAUSE_LABELS[cause]}. Optional; when any of these columns are "
                    "filled, their sum is used as the total loss.",
     "example": None}
    for cause in _CAUSE_LABELS
] + [
    {"name": "dominant_cause", "required": False, "type": "cause code",
     "description": "Main cause of loss when you only know the total: one of "
                    + ", ".join(_CAUSE_LABELS) + ". Ignored when the loss_..._kg columns are filled.",
     "example": None},
    {"name": "action_taken", "required": False, "type": "text",
     "description": "What the cooperative changed since its previous harvest (max 500 characters).",
     "example": None},
]

assert {c["name"] for c in COLUMNS} >= {f"loss_{c}_kg" for c in VALID_CAUSES}

RULES: List[str] = [
    "Save the file as CSV (in Excel: File → Save As → CSV). Comma, semicolon and tab separators all work.",
    "Use a dot for decimals and no thousands separators: 1200.5, not 1,200.5.",
    "Give either total_loss_kg or the loss_..._kg columns for each row.",
    "Run a preview first (dry_run=true): nothing is saved and every row's result is shown.",
    "The import is all-or-nothing: if any row has an error, nothing is saved. Fix the rows listed and upload again.",
    "Rows already in the system (same cooperative, district, crop, season, year and quantities) are skipped, "
    "so uploading the same file twice does not create duplicates.",
    "Every import gets a batch_id. Undo it with DELETE /datasets/imports/{batch_id}.",
    "Cooperative names starting with 'Sample Cooperative' are reserved for the labelled demo data.",
    f"At most {MAX_IMPORT_ROWS} rows and {MAX_FILE_BYTES // (1024 * 1024)} MB per file.",
]

_COLUMN_NAMES = [c["name"] for c in COLUMNS]
_REQUIRED = [c["name"] for c in COLUMNS if c["required"]]


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def _header_key(name: str) -> str:
    return "_".join(name.strip().lower().replace("-", " ").split())


def _name_key(name: str) -> str:
    return " ".join(name.split()).casefold()


def parse_csv(data: bytes) -> Tuple[List[Tuple[int, dict]], List[str]]:
    """
    Read CSV bytes into [(spreadsheet_row_number, {column: value_or_None})].
    Accepts UTF-8 (with or without the BOM Excel adds) and Windows-1252, and
    comma, semicolon or tab separators. Blank rows are skipped.
    """
    if len(data) > MAX_FILE_BYTES:
        raise ImportFileError(413, f"File is larger than {MAX_FILE_BYTES // (1024 * 1024)} MB.")
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = data.decode("cp1252", errors="replace")
    if not text.strip():
        raise ImportFileError(422, "The file is empty.")

    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t")
        delimiter = dialect.delimiter
    except csv.Error:
        delimiter = ","

    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    header = next(reader, None) or []
    keys = [_header_key(h) for h in header]

    missing = [c for c in _REQUIRED if c not in keys]
    if missing:
        raise ImportFileError(
            422,
            "Missing required column(s): " + ", ".join(missing)
            + ". Download the template from GET /datasets/import-template.",
        )
    warnings = []
    unknown = [h for h, k in zip(header, keys) if k and k not in _COLUMN_NAMES]
    if unknown:
        warnings.append("Ignored unknown column(s): " + ", ".join(unknown) + ".")

    rows: List[Tuple[int, dict]] = []
    for row_number, values in enumerate(reader, start=2):
        if not any(v.strip() for v in values):
            continue
        record = {}
        for key, value in zip(keys, values):
            if key in _COLUMN_NAMES:
                value = value.strip()
                record[key] = value if value != "" else None
        rows.append((row_number, record))
        if len(rows) > MAX_IMPORT_ROWS:
            raise ImportFileError(422, f"The file has more than {MAX_IMPORT_ROWS} rows. Split it into smaller files.")
    if not rows:
        raise ImportFileError(422, "The file has a header but no data rows.")
    return rows, warnings


def _validation_messages(exc: ValidationError) -> List[str]:
    messages = []
    for err in exc.errors():
        field = ".".join(str(p) for p in err["loc"]) or "row"
        msg = err["msg"].removeprefix("Value error, ")
        if err["type"] in ("float_parsing", "int_parsing") and "," in str(err.get("input", "")):
            msg += " — use a dot for decimals and no thousands separators (e.g. 1200.5)"
        messages.append(f"{field}: {msg}")
    return messages


# ---------------------------------------------------------------------------
# Validation and scoring (no database writes)
# ---------------------------------------------------------------------------

@dataclass
class _Planned:
    """A valid, non-duplicate row ready to be written."""
    result: ImportRowResult
    row: AssessmentImportRow
    coop_key: Tuple[str, str]
    existing_coop: Optional[Cooperative]
    loss_by_cause_kg: Optional[Dict[str, float]]


def _dup_key(coop_identity, crop, season, year, harvested, total_loss) -> tuple:
    return (coop_identity, crop, season, year, round(float(harvested), 3), round(float(total_loss), 3))


def validate_and_score(
    rows: List[Tuple[int, dict]],
    db: Session,
) -> Tuple[List[ImportRowResult], List[_Planned]]:
    options = get_options()
    districts = {d.casefold(): d for d in options["districts"]}
    crops = {c.casefold(): c for c in options["crops"]}

    coops = {(_name_key(c.name), c.district): c for c in db.query(Cooperative).all()}
    existing_keys = {
        _dup_key(a.coop_id, a.crop, a.season, a.season_year, a.harvested_qty_kg, a.total_loss_kg)
        for a in db.query(Assessment).all()
        if a.harvested_qty_kg is not None and a.total_loss_kg is not None
    }

    results: List[ImportRowResult] = []
    planned: List[_Planned] = []
    seen: Dict[tuple, int] = {}

    for row_number, raw in rows:
        result = ImportRowResult(
            row=row_number, status="error",
            cooperative_name=raw.get("cooperative_name"), district=raw.get("district"),
            crop=raw.get("crop"), season=raw.get("season"),
        )
        results.append(result)

        try:
            row = AssessmentImportRow.model_validate(raw)
        except ValidationError as exc:
            result.errors = _validation_messages(exc)
            continue

        district = districts.get(row.district.casefold())
        crop = crops.get(row.crop.casefold())
        if district is None:
            result.errors.append(f"Unknown district '{row.district}'. Use a district name from GET /options.")
        if crop is None:
            result.errors.append(f"Unknown crop '{row.crop}'. Use a crop name from GET /options.")
        if _name_key(row.cooperative_name).startswith(SAMPLE_PREFIX):
            result.errors.append("Names starting with 'Sample Cooperative' are reserved for the demo data.")

        causes = row.loss_by_cause_kg()
        if causes is None and row.total_loss_kg is None:
            result.errors.append("Give total_loss_kg or at least one loss_..._kg column.")
        if result.errors:
            continue

        coop_key = (_name_key(row.cooperative_name), district)
        existing = coops.get(coop_key)
        if existing is not None and existing.is_sample:
            result.errors.append("This name matches a sample cooperative; use a different name.")
            continue

        result.cooperative_name = row.cooperative_name
        result.district, result.crop, result.season, result.year = district, crop, row.season, row.year
        result.harvested_qty_kg = row.harvested_qty_kg
        result.cooperative_exists = existing is not None

        try:
            scored = score_assessment(
                district=district,
                crop=crop,
                season=row.season,
                harvested_qty_kg=row.harvested_qty_kg,
                loss_by_cause_kg=causes,
                total_loss_kg=row.total_loss_kg,
                reported_dominant_cause=row.dominant_cause,
            )
        except ScoringError as exc:
            result.errors.append(exc.detail)
            continue

        for field in ("total_loss_kg", "loss_rate_pct", "benchmark_loss_rate_pct", "benchmark_source",
                      "benchmark_n_records", "high_volatility", "volatility_share_total_loss_pct",
                      "risk_category", "dominant_cause", "dominant_cause_is_estimated",
                      "recommendation", "estimated_loss_value_rwf"):
            setattr(result, field, scored[field])

        if causes is not None and row.total_loss_kg is not None \
                and abs(sum(causes.values()) - row.total_loss_kg) > 0.01:
            result.warnings.append(
                f"total_loss_kg ({row.total_loss_kg}) differs from the sum of the loss columns "
                f"({sum(causes.values())}); the sum is used."
            )
        if causes is not None and row.dominant_cause and row.dominant_cause != scored["dominant_cause"]:
            result.warnings.append(
                f"dominant_cause '{row.dominant_cause}' was ignored; the loss columns show "
                f"'{scored['dominant_cause']}' as the main cause."
            )

        identity = existing.id if existing is not None else ("new",) + coop_key
        key = _dup_key(identity, crop, row.season, row.year, row.harvested_qty_kg, scored["total_loss_kg"])
        if key in existing_keys:
            result.status = "duplicate"
            result.warnings.append("This record is already in the system; it will be skipped.")
            continue
        if key in seen:
            result.status = "duplicate"
            result.warnings.append(f"Same record as row {seen[key]}; it will be skipped.")
            continue
        seen[key] = row_number

        result.status = "ok"
        planned.append(_Planned(result, row, coop_key, existing, causes))

    return results, planned


# ---------------------------------------------------------------------------
# Writing and undo
# ---------------------------------------------------------------------------

_SEASON_ORDER = {"A": 0, "B": 1, "C": 2}


def apply_import(planned: List[_Planned], db: Session) -> str:
    """
    Write every planned row in one transaction and return the batch id.
    Rows are inserted per cooperative in chronological order (year, then
    season); rows without a year keep their file order after dated ones.
    """
    batch_id = uuid.uuid4().hex
    coop_order: Dict[Tuple[str, str], int] = {}
    for p in planned:
        coop_order.setdefault(p.coop_key, len(coop_order))

    def chronological(p: _Planned):
        if p.row.year is None:
            return (coop_order[p.coop_key], 1, 0, 0, p.result.row)
        return (coop_order[p.coop_key], 0, p.row.year, _SEASON_ORDER.get(p.row.season, 3), p.result.row)

    try:
        created: Dict[Tuple[str, str], Cooperative] = {}
        for p in sorted(planned, key=chronological):
            coop = p.existing_coop or created.get(p.coop_key)
            if coop is None:
                coop = Cooperative(
                    name=" ".join(p.row.cooperative_name.split()),
                    district=p.result.district,
                    is_sample=False,
                    import_batch_id=batch_id,
                )
                db.add(coop)
                db.flush()
                created[p.coop_key] = coop

            r = p.result
            assessment = Assessment(
                coop_id=coop.id,
                district=r.district,
                crop=r.crop,
                season=r.season,
                season_year=r.year,
                harvested_qty_kg=r.harvested_qty_kg,
                total_loss_kg=r.total_loss_kg,
                loss_rate_pct=r.loss_rate_pct,
                benchmark_used_pct=r.benchmark_loss_rate_pct,
                benchmark_source=r.benchmark_source,
                risk_category=r.risk_category,
                dominant_cause=r.dominant_cause,
                dominant_cause_is_estimated=r.dominant_cause_is_estimated,
                recommendation_text=r.recommendation,
                estimated_loss_value_rwf=r.estimated_loss_value_rwf,
                cause_breakdown_json=json.dumps(p.loss_by_cause_kg) if p.loss_by_cause_kg else None,
                action_notes=p.row.action_taken,
                import_batch_id=batch_id,
            )
            db.add(assessment)
            db.flush()
            r.assessment_id = assessment.id
        db.commit()
    except Exception:
        db.rollback()
        raise
    return batch_id


def undo_import(batch_id: str, db: Session) -> Optional[Tuple[int, int]]:
    """
    Delete the batch's assessments, then any cooperative the batch created
    that no longer has assessments. Returns (assessments_deleted,
    cooperatives_deleted), or None if the batch id is unknown.
    """
    assessments = db.query(Assessment).filter(Assessment.import_batch_id == batch_id).all()
    created_coops = db.query(Cooperative).filter(Cooperative.import_batch_id == batch_id).all()
    if not assessments and not created_coops:
        return None
    try:
        for a in assessments:
            db.delete(a)
        db.flush()
        removed = 0
        for coop in created_coops:
            if db.query(Assessment).filter(Assessment.coop_id == coop.id).first() is None:
                db.delete(coop)
                removed += 1
        db.commit()
    except Exception:
        db.rollback()
        raise
    return len(assessments), removed


def template_csv() -> str:
    """CSV template: every column, plus one visibly fictional example row."""
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\r\n")
    writer.writerow(_COLUMN_NAMES)
    writer.writerow([c["example"] or "" for c in COLUMNS])
    return "﻿" + out.getvalue()
