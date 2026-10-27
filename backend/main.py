"""
main.py

FastAPI application for the Cooperative Post-Harvest Loss Tracker.

Endpoints:
  GET  /health
  GET  /options
  GET  /benchmark
  GET  /estimate                        Task 1
  POST /coop
  GET  /coops
  POST /assess
  GET  /assess/{assessment_id}/summary  Task 2
  GET  /assessments/{coop_id}
  GET  /overview/dispatch-triggers      Task 4
  GET  /overview/outliers               Task 5
  GET  /overview/policy-alignment       Task 6
  GET  /overview/storage-comparison     Task 7
  GET  /overview/national-summary
  GET  /overview/map
  GET  /overview/by-crop
  GET  /overview/top-risk
  GET  /about-data
  GET  /datasets/import-template        CSV template download
  GET  /datasets/import-format          column reference
  POST /datasets/import-assessments     JSON records   (?dry_run=true to preview)
  POST /datasets/import-assessments/file  CSV upload   (?dry_run=true to preview)
  DELETE /datasets/imports/{batch_id}   undo an import

Set SEED_DEMO=true to create clearly labelled sample cooperatives on startup
when the database is empty (see seed_demo.py).
"""

from __future__ import annotations

import json
import os
from collections import Counter
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from about_data import METHODOLOGY, SOURCES
from benchmark_service import (
    get_by_crop,
    get_district_map,
    get_metadata,
    get_national_summary,
    get_options,
    get_overall_national_loss_rate,
    get_storage_comparison,
    get_top_risk,
    lookup_benchmark,
)
from db import Assessment, Cooperative, get_db, init_db
from import_service import (
    COLUMNS,
    MAX_FILE_BYTES,
    RULES,
    ImportFileError,
    apply_import,
    parse_csv,
    template_csv,
    undo_import,
    validate_and_score,
)
from models import (
    MAX_IMPORT_ROWS,
    AboutDataOut,
    AssessmentHistoryItem,
    AssessmentImportRequest,
    AssessOut,
    AssessRequest,
    BenchmarkOut,
    ByCropOut,
    CoopCreate,
    CoopOut,
    DispatchTriggerItem,
    DispatchTriggersOut,
    EstimateOut,
    ImportFormatOut,
    ImportResultOut,
    ImportUndoOut,
    MapOut,
    NationalSummaryOut,
    OutlierItem,
    OutliersOut,
    PolicyAlignmentOut,
    StorageComparisonOut,
    StorageTypeItem,
    SummaryOut,
    TopRiskOut,
)
from scoring_service import ScoringError, score_assessment

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Post-Harvest Loss Tracker API",
    description="Backend for the NISR 2026 Big Data Hackathon cooperative tool.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    if os.getenv("SEED_DEMO", "").lower() == "true":
        from seed_demo import seed_if_empty
        seed_if_empty()


# ---------------------------------------------------------------------------
# Dispatch trigger intervention table  (Task 4)
# ---------------------------------------------------------------------------

_INTERVENTION: dict = {
    "theft":              "Community storage security",
    "insects_pests":      "Pest control / fumigation",
    "birds_animals":      "Netting / scarecrow deployment",
    "stalks_fallen":      "Harvesting technique training",
    "harvesting_damage":  "Harvesting technique training",
    "transport":          "Transport coordination support",
    "storage":            "Storage infrastructure (hermetic bags, drying racks)",
    "processing":         "Mobile mechanical dryer dispatch",
    "packaging":          "Packaging materials support",
    "sale":               "Market timing / access support",
}

# ---------------------------------------------------------------------------
# Policy-alignment constants  (Task 6)
# Cited from Rwanda NST2, presented to Parliament August 2025.
# These are official figures — NOT derived from the survey data.
# ---------------------------------------------------------------------------

_NST2_BASELINE_2023_PCT: float = 13.8
_NST2_TARGET_2029_PCT: float = 5.0
_NST2_SOURCE: str = "Rwanda NST2 (presented to Parliament, August 2025)"


# ===========================================================================
# GET /health
# ===========================================================================

@app.get("/health")
def health():
    return {"status": "ok"}


# ===========================================================================
# GET /options
# ===========================================================================

@app.get("/options")
def api_options():
    """
    Returns the sorted list of valid district and crop names drawn directly
    from benchmarks.json.  Use these to populate dropdowns so that
    GET /benchmark and POST /assess never receive a typo-driven 404.
    """
    return get_options()


# ===========================================================================
# GET /benchmark
# ===========================================================================

@app.get("/benchmark", response_model=BenchmarkOut)
def get_benchmark(
    district: str = Query(..., description="Rwandan district name"),
    crop: str = Query(..., description="NISR crop category name"),
    season: Optional[str] = Query(None, description="Season: A, B, or C"),
):
    result = lookup_benchmark(district=district, crop=crop, season=season)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No benchmark data found for district='{district}', crop='{crop}'"
                + (f", season='{season}'" if season else "")
                + ". Check that the district and crop names match the NISR dataset exactly."
            ),
        )
    return BenchmarkOut(
        district=district,
        crop=crop,
        season=season,
        benchmark_loss_rate_pct=result["benchmark_loss_rate_pct"],
        benchmark_source=result["benchmark_source"],
        avg_selling_price_rwf_per_kg=result["avg_selling_price_rwf_per_kg"],
        cause_of_loss_breakdown_pct=result["cause_of_loss_breakdown_pct"],
        benchmark_n_records=result["benchmark_n_records"],
        high_volatility=result["high_volatility"],
        volatility_share_total_loss_pct=result["volatility_share_total_loss_pct"],
    )


# ===========================================================================
# GET /estimate  (Task 1 — pre-season risk estimator)
# ===========================================================================

@app.get("/estimate", response_model=EstimateOut)
def get_estimate(
    district: str = Query(..., description="Rwandan district name"),
    crop: str = Query(..., description="NISR crop category name"),
    season: str = Query(..., description="Season: A, B, or C"),
    projected_harvest_kg: float = Query(..., description="Expected harvest in kg (must be > 0)"),
):
    if projected_harvest_kg <= 0:
        raise HTTPException(
            status_code=400,
            detail="projected_harvest_kg must be greater than 0.",
        )

    result = lookup_benchmark(district=district, crop=crop, season=season)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No benchmark data found for district='{district}', crop='{crop}'"
                f", season='{season}'. Check that district and crop names match the "
                "NISR dataset exactly."
            ),
        )

    benchmark_loss_rate_pct: float = result["benchmark_loss_rate_pct"]
    price_per_kg: Optional[float] = result["avg_selling_price_rwf_per_kg"]

    expected_loss_kg = round(projected_harvest_kg * benchmark_loss_rate_pct / 100, 2)
    expected_loss_value_rwf = (
        round(expected_loss_kg * price_per_kg, 2) if price_per_kg is not None else None
    )

    return EstimateOut(
        district=district,
        crop=crop,
        season=season,
        projected_harvest_kg=projected_harvest_kg,
        benchmark_loss_rate_pct=benchmark_loss_rate_pct,
        benchmark_source=result["benchmark_source"],
        expected_loss_kg=expected_loss_kg,
        expected_loss_value_rwf=expected_loss_value_rwf,
        avg_selling_price_rwf_per_kg=price_per_kg,
        benchmark_n_records=result["benchmark_n_records"],
    )


# ===========================================================================
# POST /coop
# ===========================================================================

@app.post("/coop", response_model=CoopOut, status_code=201)
def create_coop(body: CoopCreate, db: Session = Depends(get_db)):
    coop = Cooperative(name=body.name, district=body.district)
    db.add(coop)
    db.commit()
    db.refresh(coop)
    return CoopOut.model_validate(coop)


# ===========================================================================
# GET /coops
# ===========================================================================

@app.get("/coops", response_model=List[CoopOut])
def list_coops(db: Session = Depends(get_db)):
    coops = db.query(Cooperative).all()
    return [CoopOut.model_validate(c) for c in coops]


# ===========================================================================
# POST /assess
# ===========================================================================

@app.post("/assess", response_model=AssessOut, status_code=201)
def create_assessment(body: AssessRequest, db: Session = Depends(get_db)):
    # ---- 0-9. Validate inputs and compute every derived field (shared with imports) ----
    try:
        scored = score_assessment(
            district=body.district,
            crop=body.crop,
            season=body.season,
            harvested_qty_kg=body.harvested_qty_kg,
            loss_by_cause_kg=body.loss_by_cause_kg,
            total_loss_kg=body.total_loss_kg,
        )
    except ScoringError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    # ---- 10. Verify coop exists ----
    coop = db.query(Cooperative).filter(Cooperative.id == body.coop_id).first()
    if coop is None:
        raise HTTPException(
            status_code=404,
            detail=f"Cooperative with id={body.coop_id} not found.",
        )

    # ---- 11. Persist assessment (includes Task 3 action_notes) ----
    assessment = Assessment(
        coop_id=body.coop_id,
        district=body.district,
        crop=body.crop,
        season=body.season,
        season_year=body.year,
        harvested_qty_kg=body.harvested_qty_kg,
        total_loss_kg=scored["total_loss_kg"],
        loss_rate_pct=scored["loss_rate_pct"],
        benchmark_used_pct=scored["benchmark_loss_rate_pct"],
        benchmark_source=scored["benchmark_source"],
        risk_category=scored["risk_category"],
        dominant_cause=scored["dominant_cause"],
        dominant_cause_is_estimated=scored["dominant_cause_is_estimated"],
        recommendation_text=scored["recommendation"],
        estimated_loss_value_rwf=scored["estimated_loss_value_rwf"],
        cause_breakdown_json=(
            json.dumps(body.loss_by_cause_kg) if body.loss_by_cause_kg is not None else None
        ),
        action_notes=body.previous_assessment_action_taken,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return AssessOut(
        assessment_id=assessment.id,
        loss_rate_pct=scored["loss_rate_pct"],
        benchmark_loss_rate_pct=scored["benchmark_loss_rate_pct"],
        benchmark_source=scored["benchmark_source"],
        risk_category=scored["risk_category"],
        dominant_cause=scored["dominant_cause"],
        dominant_cause_is_estimated=scored["dominant_cause_is_estimated"],
        recommendation=scored["recommendation"],
        estimated_loss_value_rwf=scored["estimated_loss_value_rwf"],
        cause_of_loss_breakdown_pct=scored["cause_of_loss_breakdown_pct"],
        benchmark_n_records=scored["benchmark_n_records"],
        high_volatility=scored["high_volatility"],
        volatility_share_total_loss_pct=scored["volatility_share_total_loss_pct"],
    )


# ===========================================================================
# GET /assess/{assessment_id}/summary  (Task 2 — field-ready SMS summary)
# ===========================================================================

@app.get("/assess/{assessment_id}/summary", response_model=SummaryOut)
def get_assessment_summary(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if assessment is None:
        raise HTTPException(
            status_code=404,
            detail=f"Assessment with id={assessment_id} not found.",
        )

    # Format value lost (e.g. "322,885 RWF" or "N/A")
    if assessment.estimated_loss_value_rwf is not None:
        value_str = f"{assessment.estimated_loss_value_rwf:,.0f} RWF"
    else:
        value_str = "N/A"

    # Shorten the recommendation to a compact tip (strip leading "Consider " / "Review ")
    tip = assessment.recommendation_text or ""
    for prefix in ("Consider ", "Review "):
        if tip.startswith(prefix):
            tip = tip[len(prefix):]
            # Capitalise first character
            tip = tip[0].upper() + tip[1:] if tip else tip
            break
    # Trim to keep well under 300 chars total
    if len(tip) > 120:
        tip = tip[:117].rstrip() + "..."

    cause_label = (assessment.dominant_cause or "unknown").replace("_", " ").title()
    season_label = f"Season {assessment.season}" if assessment.season else "Season ?"

    summary_text = (
        f"{(assessment.crop or '?').upper()} - "
        f"{(assessment.district or '?').upper()} - {season_label}\n"
        f"Loss: {assessment.loss_rate_pct}% "
        f"(District avg: {assessment.benchmark_used_pct}%) - "
        f"{(assessment.risk_category or '?').upper()} RISK\n"
        f"Main cause: {cause_label}\n"
        f"Est. value lost: {value_str}\n"
        f"Tip: {tip}"
    )

    return SummaryOut(assessment_id=assessment_id, summary_text=summary_text)


# ===========================================================================
# GET /assessments/{coop_id}
# ===========================================================================

@app.get("/assessments/{coop_id}", response_model=List[AssessmentHistoryItem])
def get_assessments(coop_id: int, db: Session = Depends(get_db)):
    coop = db.query(Cooperative).filter(Cooperative.id == coop_id).first()
    if coop is None:
        raise HTTPException(
            status_code=404,
            detail=f"Cooperative with id={coop_id} not found.",
        )
    assessments = (
        db.query(Assessment)
        .filter(Assessment.coop_id == coop_id)
        .order_by(Assessment.created_at.asc(), Assessment.id.asc())
        .all()
    )
    # Chronological by harvest year (imported history), falling back to the
    # year the record was entered. Rows with a known year are ordered by
    # season within it; otherwise entry order is kept (the sort is stable).
    assessments.sort(key=lambda a: (
        a.season_year or (a.created_at.year if a.created_at else 0),
        "ABC".find(a.season or "") if a.season_year else 0,
    ))
    return [AssessmentHistoryItem.model_validate(a) for a in assessments]


# ===========================================================================
# GET /overview/dispatch-triggers  (Task 4)
# ===========================================================================

@app.get("/overview/dispatch-triggers", response_model=DispatchTriggersOut)
def dispatch_triggers(
    district: Optional[str] = Query(None, description="Filter by district; omit for all districts"),
    db: Session = Depends(get_db),
):
    query = db.query(Assessment)
    if district:
        query = query.filter(Assessment.district == district)

    rows = query.all()
    assessment_count = len(rows)

    # Count by dominant_cause, excluding rows where it's null
    cause_counts: Counter = Counter(
        r.dominant_cause for r in rows if r.dominant_cause is not None
    )

    triggers = [
        DispatchTriggerItem(
            dominant_cause=cause,
            count=count,
            suggested_intervention=_INTERVENTION.get(cause, "General support"),
        )
        for cause, count in cause_counts.most_common()
    ]

    return DispatchTriggersOut(
        district=district,
        assessment_count=assessment_count,
        dispatch_triggers=triggers,
    )


# ===========================================================================
# GET /overview/outliers  (Task 5)
# ===========================================================================

@app.get("/overview/outliers", response_model=OutliersOut)
def outliers(
    threshold_multiplier: float = Query(
        1.5, description="Flag assessments where loss_rate > benchmark * this multiplier"
    ),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Assessment)
        .filter(
            Assessment.loss_rate_pct.isnot(None),
            Assessment.benchmark_used_pct.isnot(None),
            Assessment.benchmark_used_pct > 0,
        )
        .all()
    )

    result: List[OutlierItem] = []
    for r in rows:
        if r.loss_rate_pct > r.benchmark_used_pct * threshold_multiplier:
            result.append(
                OutlierItem(
                    assessment_id=r.id,
                    coop_id=r.coop_id,
                    district=r.district,
                    crop=r.crop,
                    season=r.season,
                    loss_rate_pct=r.loss_rate_pct,
                    benchmark_used_pct=r.benchmark_used_pct,
                    deviation_ratio=round(r.loss_rate_pct / r.benchmark_used_pct, 2),
                )
            )

    result.sort(key=lambda x: x.deviation_ratio, reverse=True)
    return OutliersOut(outliers=result)


# ===========================================================================
# GET /overview/policy-alignment  (Task 6)
# ===========================================================================

@app.get("/overview/policy-alignment", response_model=PolicyAlignmentOut)
def policy_alignment():
    return PolicyAlignmentOut(
        national_baseline_2023_pct=_NST2_BASELINE_2023_PCT,
        national_target_2029_pct=_NST2_TARGET_2029_PCT,
        source=_NST2_SOURCE,
        survey_derived_current_estimate_pct=get_overall_national_loss_rate(),
        survey_derived_note=(
            "Computed from the 2024-2025 NISR Seasonal Agricultural Survey data used "
            "by this tool. Not an official government figure — shown for context "
            "alongside the official baseline/target above, not as a replacement for them."
        ),
    )


# ===========================================================================
# GET /overview/storage-comparison  (Task 7)
# ===========================================================================

@app.get("/overview/storage-comparison", response_model=StorageComparisonOut)
def storage_comparison(
    crop: str = Query(..., description="NISR crop category name"),
):
    rows = get_storage_comparison(crop)
    if rows is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No storage-type breakdown available for crop='{crop}'. "
                "Check the crop name matches the NISR dataset exactly."
            ),
        )
    return StorageComparisonOut(
        crop=crop,
        storage_types=[StorageTypeItem(**r) for r in rows],
    )


# ===========================================================================
# GET /overview/national-summary
# ===========================================================================

@app.get("/overview/national-summary", response_model=NationalSummaryOut)
def national_summary():
    return NationalSummaryOut(
        **get_national_summary(),
        nst2={
            "baseline_2023_pct": _NST2_BASELINE_2023_PCT,
            "target_2029_pct": _NST2_TARGET_2029_PCT,
            "source": _NST2_SOURCE,
        },
    )


# ===========================================================================
# GET /overview/map
# ===========================================================================

@app.get("/overview/map", response_model=MapOut)
def district_map(
    season: Optional[Literal["A", "B", "C"]] = Query(None, description="Season: A, B, or C; omit for all seasons"),
    crop: Optional[str] = Query(None, description="NISR crop category name; omit for all crops"),
):
    if crop is not None and crop not in get_options()["crops"]:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown crop='{crop}'. Use GET /options for the valid crop names.",
        )
    return MapOut(**get_district_map(season=season, crop=crop))


# ===========================================================================
# GET /overview/by-crop
# ===========================================================================

@app.get("/overview/by-crop", response_model=ByCropOut)
def by_crop(
    district: Optional[str] = Query(None, description="Rwandan district name; omit for national figures"),
    season: Optional[Literal["A", "B", "C"]] = Query(None, description="Season: A, B, or C (requires district)"),
):
    if season is not None and district is None:
        raise HTTPException(
            status_code=400,
            detail="season requires district: the survey data has no national per-crop figure by season.",
        )
    rows = get_by_crop(district=district, season=season)
    if rows is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown district='{district}'. Use GET /options for the valid district names.",
        )
    return ByCropOut(district=district, season=season, crops=rows)


# ===========================================================================
# GET /overview/top-risk
# ===========================================================================

@app.get("/overview/top-risk", response_model=TopRiskOut)
def top_risk(
    season: Optional[Literal["A", "B", "C"]] = Query(None, description="Season: A, B, or C; omit for all seasons"),
    limit: int = Query(10, ge=1, le=50, description="Number of groups to return"),
    min_records: int = Query(30, ge=5, description="Skip groups with fewer surveyed plots than this"),
):
    return TopRiskOut(
        season=season,
        min_records=min_records,
        groups=get_top_risk(season=season, limit=limit, min_records=min_records),
    )


# ===========================================================================
# GET /about-data
# ===========================================================================

@app.get("/about-data", response_model=AboutDataOut)
def about_data():
    return AboutDataOut(metadata=get_metadata(), methodology=METHODOLOGY, sources=SOURCES)


# ===========================================================================
# Dataset import  (/datasets/...)
# ===========================================================================

@app.get("/datasets/import-template")
def import_template():
    """CSV template with every column and one visibly fictional example row."""
    return Response(
        content=template_csv(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="harvest_import_template.csv"'},
    )


@app.get("/datasets/import-format", response_model=ImportFormatOut)
def import_format():
    return ImportFormatOut(
        max_rows=MAX_IMPORT_ROWS, max_file_bytes=MAX_FILE_BYTES, columns=COLUMNS, rules=RULES
    )


def _run_import(rows, file_warnings, dry_run: bool, db: Session) -> JSONResponse:
    """
    Score every row, then (unless dry_run) write them all or nothing.

    dry_run          → 200, status "preview" (errors listed, nothing saved)
    any row invalid  → 422, status "failed"  (nothing saved)
    imported         → 201 (200 when every row was a duplicate)
    """
    results, planned = validate_and_score(rows, db)
    errors = [f"Row {r.row}: {msg}" for r in results for msg in r.errors]
    new_coops = {p.coop_key for p in planned if p.existing_coop is None}
    matched_coops = {p.existing_coop.id for p in planned if p.existing_coop is not None}

    batch_id = None
    if dry_run:
        status, code = "preview", 200
    elif errors:
        status, code = "failed", 422
    else:
        batch_id = apply_import(planned, db) if planned else None
        status, code = "imported", (201 if planned else 200)

    out = ImportResultOut(
        status=status,
        dry_run=dry_run,
        batch_id=batch_id,
        total_received=len(results),
        valid_count=sum(r.status != "error" for r in results),
        imported_count=len(planned) if batch_id else 0,
        skipped_duplicates=sum(r.status == "duplicate" for r in results),
        cooperatives_created=len(new_coops),
        cooperatives_matched=len(matched_coops),
        rows=results,
        errors=errors,
        warnings=file_warnings,
    )
    return JSONResponse(content=jsonable_encoder(out), status_code=code)


@app.post(
    "/datasets/import-assessments",
    response_model=ImportResultOut,
    responses={201: {"model": ImportResultOut}, 422: {"model": ImportResultOut}},
)
def import_assessments(
    body: AssessmentImportRequest,
    dry_run: bool = Query(False, description="Preview the results without saving anything"),
    db: Session = Depends(get_db),
):
    """
    Import a JSON list of records (same columns as the CSV template).
    Row numbers in the response follow a spreadsheet: records[0] is row 2.
    """
    rows = [(i, record) for i, record in enumerate(body.records, start=2)]
    return _run_import(rows, [], dry_run, db)


@app.post(
    "/datasets/import-assessments/file",
    response_model=ImportResultOut,
    responses={201: {"model": ImportResultOut}, 422: {"model": ImportResultOut}},
)
async def import_assessments_file(
    file: UploadFile = File(..., description="CSV file in the format of GET /datasets/import-template"),
    dry_run: bool = Query(False, description="Preview the results without saving anything"),
    db: Session = Depends(get_db),
):
    name = (file.filename or "").lower()
    if name.endswith((".xlsx", ".xls", ".ods")):
        raise HTTPException(
            status_code=415,
            detail="Spreadsheet files can't be read directly. In Excel choose File → Save As → CSV, then upload the CSV.",
        )
    if not name.endswith((".csv", ".txt")) and "csv" not in (file.content_type or ""):
        raise HTTPException(status_code=415, detail="Upload a .csv file.")

    data = await file.read(MAX_FILE_BYTES + 1)
    try:
        rows, file_warnings = parse_csv(data)
    except ImportFileError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    return _run_import(rows, file_warnings, dry_run, db)


@app.delete("/datasets/imports/{batch_id}", response_model=ImportUndoOut)
def delete_import(batch_id: str, db: Session = Depends(get_db)):
    """Undo an import: removes its assessments and any cooperatives it created that are now empty."""
    result = undo_import(batch_id, db)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No import found with batch_id='{batch_id}'.")
    assessments_deleted, cooperatives_deleted = result
    return ImportUndoOut(
        batch_id=batch_id,
        assessments_deleted=assessments_deleted,
        cooperatives_deleted=cooperatives_deleted,
    )
