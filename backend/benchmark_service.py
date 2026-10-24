"""
benchmark_service.py

Loads benchmarks.json once at module import time and exposes a single
lookup function that follows the exact priority order specified in the spec:

  1. district_season  (only when season is supplied)
  2. district
  3. national

Returns a dict with keys:
  benchmark_loss_rate_pct  (float)
  benchmark_source         ("district_season" | "district" | "national")
  avg_selling_price_rwf_per_kg  (float | None)
  cause_of_loss_breakdown_pct   (dict | None)

Returns None when no benchmark can be found at any level.
"""

from __future__ import annotations

import json
import os
from typing import Dict, Optional

from assessment_service import find_dominant_cause_from_national

# ---------------------------------------------------------------------------
# Load benchmarks.json once
# ---------------------------------------------------------------------------
_BENCHMARKS_PATH = os.getenv(
    "BENCHMARKS_PATH",
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "data",
        "processed",
        "benchmarks.json",
    ),
)

with open(_BENCHMARKS_PATH, "r", encoding="utf-8") as _f:
    _DATA: dict = json.load(_f)

_NATIONAL_LOSS: Dict[str, float] = _DATA["national_avg_loss_rate_pct"]
_DISTRICT_LOSS: Dict[str, Dict[str, float]] = _DATA["district_avg_loss_rate_pct"]
_DISTRICT_SEASON_LOSS: Dict[str, Dict[str, float]] = _DATA["district_season_avg_loss_rate_pct"]
_NATIONAL_PRICE: Dict[str, float] = _DATA["national_avg_selling_price_rwf_per_kg"]
_NATIONAL_CAUSE: Dict[str, Dict[str, float]] = _DATA["national_cause_of_loss_breakdown_pct"]
_OVERALL_NATIONAL_LOSS_RATE: float = _DATA["overall_national_avg_loss_rate_pct"]
_STORAGE_TYPE_LOSS: Dict[str, Dict] = _DATA.get("avg_loss_rate_by_storage_type_pct", {})

# Extended metrics (added for the redesigned UI). Read with .get() so an older
# benchmarks.json without these keys still loads.
_NATIONAL_N: Dict[str, int] = _DATA.get("national_n_records", {})
_DISTRICT_N: Dict[str, Dict[str, int]] = _DATA.get("district_n_records", {})
_DISTRICT_SEASON_N: Dict[str, Dict[str, int]] = _DATA.get("district_season_n_records", {})
_HIGH_VOL: Dict[str, Dict[str, Dict]] = _DATA.get("high_volatility_benchmarks", {})
_DISTRICT_OVERALL: Dict[str, Dict] = _DATA.get("district_overall_avg_loss_rate_pct", {})
_DISTRICT_SEASON_OVERALL: Dict[str, Dict] = _DATA.get("district_season_overall_avg_loss_rate_pct", {})
_SEASON_OVERALL: Dict[str, Dict] = _DATA.get("season_overall_avg_loss_rate_pct", {})
_CAUSE_ALL: Dict[str, float] = _DATA.get("national_cause_of_loss_breakdown_all_crops_pct", {})
_METADATA: dict = _DATA.get("metadata", {})


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def lookup_benchmark(
    district: str,
    crop: str,
    season: Optional[str] = None,
) -> Optional[dict]:
    """
    Apply the three-level benchmark lookup and return a result dict, or None
    if no benchmark can be found at any level.
    """
    benchmark_loss: Optional[float] = None
    source: Optional[str] = None
    n_records: Optional[int] = None
    volatility: Optional[dict] = None

    # 1. district_season (only when season is provided)
    if season is not None:
        key = f"{district}|{season}"
        ds_entry = _DISTRICT_SEASON_LOSS.get(key, {})
        if crop in ds_entry:
            benchmark_loss = ds_entry[crop]
            source = "district_season"
            n_records = _DISTRICT_SEASON_N.get(key, {}).get(crop)
            volatility = _HIGH_VOL.get(key, {}).get(crop)

    # 2. district (fallback)
    if benchmark_loss is None:
        d_entry = _DISTRICT_LOSS.get(district, {})
        if crop in d_entry:
            benchmark_loss = d_entry[crop]
            source = "district"
            n_records = _DISTRICT_N.get(district, {}).get(crop)

    # 3. national (final fallback)
    if benchmark_loss is None:
        if crop in _NATIONAL_LOSS:
            benchmark_loss = _NATIONAL_LOSS[crop]
            source = "national"
            n_records = _NATIONAL_N.get(crop)

    if benchmark_loss is None:
        return None  # caller must raise 404

    return {
        "benchmark_loss_rate_pct": benchmark_loss,
        "benchmark_source": source,
        "avg_selling_price_rwf_per_kg": _NATIONAL_PRICE.get(crop),
        "cause_of_loss_breakdown_pct": _NATIONAL_CAUSE.get(crop),
        "benchmark_n_records": n_records,
        # Volatility is only flagged at district_season level, where it is computed.
        "high_volatility": volatility is not None,
        "volatility_share_total_loss_pct": (
            volatility["share_plots_total_loss_pct"] if volatility else None
        ),
    }


def get_national_cause_breakdown(crop: str) -> Optional[Dict[str, float]]:
    """Return the national cause-of-loss breakdown for a crop, or None."""
    return _NATIONAL_CAUSE.get(crop)


def get_options() -> dict:
    """
    Return the sorted list of valid district names and crop category names,
    derived from data already loaded at import time.

    districts → keys of district_avg_loss_rate_pct  (the per-district lookup table)
    crops     → keys of national_avg_loss_rate_pct   (the national superset)

    Both lists are alphabetically sorted so the frontend can render them as-is.
    """
    return {
        "districts": sorted(_DISTRICT_LOSS.keys()),
        "crops": sorted(_NATIONAL_LOSS.keys()),
    }


def get_overall_national_loss_rate() -> float:
    """
    Return the single blended national average loss rate across all crops,
    derived from the NISR survey data (overall_national_avg_loss_rate_pct).
    """
    return _OVERALL_NATIONAL_LOSS_RATE


def get_storage_comparison(crop: str) -> Optional[list]:
    """
    Return the survey-derived per-storage-type loss data for the given crop,
    sorted ascending by avg_loss_rate_pct (best storage type first).

    Each element: {"storage_type": str, "avg_loss_rate_pct": float, "n_records": int}

    Returns None if no storage-type breakdown is available for that crop.
    """
    crop_data = _STORAGE_TYPE_LOSS.get(crop)
    if not crop_data:
        return None
    rows = [
        {
            "storage_type": st,
            "avg_loss_rate_pct": vals["avg_loss_rate_pct"],
            "n_records": vals["n_records"],
        }
        for st, vals in crop_data.items()
    ]
    return sorted(rows, key=lambda r: r["avg_loss_rate_pct"])


def _volatile_in_any_season(district: str, crop: str) -> bool:
    """
    True if any season of this district is flagged high-volatility for the
    crop. Used for season-pooled rows, whose average includes that season.
    """
    return any(
        crop in _HIGH_VOL.get(f"{district}|{season}", {}) for season in ("A", "B", "C")
    )


def get_metadata() -> dict:
    """Return the dataset metadata block (source, years, record counts)."""
    return dict(_METADATA)


def get_national_summary() -> dict:
    """
    Return the headline national figures for the Home / National picture
    screens. Every value is read from benchmarks.json; the caller attaches
    the official NST2 block.

    top_districts → the 5 districts with the highest all-crop loss rate.
    """
    top = sorted(
        _DISTRICT_OVERALL.items(),
        key=lambda kv: kv[1]["avg_loss_rate_pct"],
        reverse=True,
    )[:5]
    return {
        "overall_avg_loss_rate_pct": _OVERALL_NATIONAL_LOSS_RATE,
        "n_records": _METADATA.get("n_records"),
        "n_records_with_loss": _METADATA.get("n_records_with_loss"),
        "share_records_with_loss_pct": _METADATA.get("share_records_with_loss_pct"),
        "n_districts": _METADATA.get("n_districts"),
        "n_crop_categories": _METADATA.get("n_crop_categories"),
        "survey_years": _METADATA.get("survey_years", []),
        "season_overall": _SEASON_OVERALL,
        "cause_breakdown_all_crops_pct": _CAUSE_ALL,
        "top_districts": [
            {"district": d, "avg_loss_rate_pct": v["avg_loss_rate_pct"], "n_records": v["n_records"]}
            for d, v in top
        ],
    }


def get_district_map(season: Optional[str] = None, crop: Optional[str] = None) -> dict:
    """
    Return one loss rate per district for the national map, choosing the
    source by which filters are given:

      season  crop   source                                  national reference
      ------  -----  --------------------------------------  -----------------------------
      -       -      district_overall_avg_loss_rate_pct      overall_national_avg_loss_rate_pct
      yes     -      district_season_overall_avg_loss_rate   season_overall[season]
      -       yes    district_avg_loss_rate_pct              national_avg_loss_rate_pct[crop]
      yes     yes    district_season_avg_loss_rate_pct       national_avg_loss_rate_pct[crop]

    Districts with no value for the filter are listed in districts_without_data
    (never returned as zero). high_volatility is only possible when a crop is
    given; with no season it is true when any season of that district is
    flagged for the crop. The caller validates crop against get_options().
    """
    rows = []
    if crop is None:
        if season is None:
            reference = _OVERALL_NATIONAL_LOSS_RATE
            entries = _DISTRICT_OVERALL.items()
        else:
            reference = _SEASON_OVERALL.get(season, {}).get("avg_loss_rate_pct")
            suffix = f"|{season}"
            entries = (
                (k[: -len(suffix)], v)
                for k, v in _DISTRICT_SEASON_OVERALL.items()
                if k.endswith(suffix)
            )
        for district, v in entries:
            rows.append({
                "district": district,
                "avg_loss_rate_pct": v["avg_loss_rate_pct"],
                "n_records": v["n_records"],
                "high_volatility": False,
            })
    else:
        reference = _NATIONAL_LOSS.get(crop)
        for district in _DISTRICT_LOSS:
            if season is None:
                value = _DISTRICT_LOSS[district].get(crop)
                n = _DISTRICT_N.get(district, {}).get(crop)
                volatile = _volatile_in_any_season(district, crop)
            else:
                key = f"{district}|{season}"
                value = _DISTRICT_SEASON_LOSS.get(key, {}).get(crop)
                n = _DISTRICT_SEASON_N.get(key, {}).get(crop)
                volatile = crop in _HIGH_VOL.get(key, {})
            if value is None:
                continue
            rows.append({
                "district": district,
                "avg_loss_rate_pct": value,
                "n_records": n,
                "high_volatility": volatile,
            })

    for r in rows:
        r["above_reference"] = reference is not None and r["avg_loss_rate_pct"] > reference
    rows.sort(key=lambda r: r["avg_loss_rate_pct"], reverse=True)

    present = {r["district"] for r in rows}
    return {
        "season": season,
        "crop": crop,
        "national_reference_pct": reference,
        "districts": rows,
        "districts_without_data": sorted(set(get_options()["districts"]) - present),
    }


def get_by_crop(district: Optional[str] = None, season: Optional[str] = None) -> Optional[list]:
    """
    Return one row per crop, sorted descending by loss rate.

    No filters        → national per-crop rates
    district          → that district's per-crop rates
    district + season → that district/season's per-crop rates

    Season without district is not supported (the data has no national
    per-crop-per-season figure); the caller rejects it. Returns None for an
    unknown district.
    """
    if district is None:
        rates, counts = _NATIONAL_LOSS, _NATIONAL_N
    elif district not in _DISTRICT_LOSS:
        return None
    elif season is None:
        rates, counts = _DISTRICT_LOSS[district], _DISTRICT_N.get(district, {})
    else:
        key = f"{district}|{season}"
        rates = _DISTRICT_SEASON_LOSS.get(key, {})
        counts = _DISTRICT_SEASON_N.get(key, {})

    rows = []
    for crop, value in rates.items():
        rows.append({
            "crop": crop,
            "avg_loss_rate_pct": value,
            "n_records": counts.get(crop),
            "national_reference_pct": _NATIONAL_LOSS.get(crop),
            "avg_selling_price_rwf_per_kg": _NATIONAL_PRICE.get(crop),
            "dominant_cause": find_dominant_cause_from_national(_NATIONAL_CAUSE.get(crop)),
        })
    return sorted(rows, key=lambda r: r["avg_loss_rate_pct"], reverse=True)


def get_top_risk(
    season: Optional[str] = None,
    limit: int = 10,
    min_records: int = 30,
) -> list:
    """
    Rank district × crop groups (district × season × crop when season is
    given) by benchmark loss rate, highest first.

    Groups with fewer than min_records usable plots are skipped so that tiny
    samples do not dominate the ranking. High-volatility groups are kept and
    flagged, not hidden; without a season, a group is flagged when any of
    its seasons is.
    """
    rows = []
    for district in _DISTRICT_LOSS:
        if season is None:
            rates = _DISTRICT_LOSS[district]
            counts = _DISTRICT_N.get(district, {})
            vol = {c for c in rates if _volatile_in_any_season(district, c)}
        else:
            key = f"{district}|{season}"
            rates = _DISTRICT_SEASON_LOSS.get(key, {})
            counts = _DISTRICT_SEASON_N.get(key, {})
            vol = _HIGH_VOL.get(key, {})
        for crop, value in rates.items():
            n = counts.get(crop)
            if n is None or n < min_records:
                continue
            national = _NATIONAL_LOSS.get(crop)
            rows.append({
                "district": district,
                "season": season,
                "crop": crop,
                "avg_loss_rate_pct": value,
                "n_records": n,
                "national_reference_pct": national,
                "ratio_to_national": round(value / national, 2) if national else None,
                "high_volatility": crop in vol,
            })
    rows.sort(key=lambda r: r["avg_loss_rate_pct"], reverse=True)
    return rows[:limit]
