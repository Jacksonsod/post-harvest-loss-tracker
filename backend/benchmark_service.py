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

    # 1. district_season (only when season is provided)
    if season is not None:
        key = f"{district}|{season}"
        ds_entry = _DISTRICT_SEASON_LOSS.get(key, {})
        if crop in ds_entry:
            benchmark_loss = ds_entry[crop]
            source = "district_season"

    # 2. district (fallback)
    if benchmark_loss is None:
        d_entry = _DISTRICT_LOSS.get(district, {})
        if crop in d_entry:
            benchmark_loss = d_entry[crop]
            source = "district"

    # 3. national (final fallback)
    if benchmark_loss is None:
        if crop in _NATIONAL_LOSS:
            benchmark_loss = _NATIONAL_LOSS[crop]
            source = "national"

    if benchmark_loss is None:
        return None  # caller must raise 404

    return {
        "benchmark_loss_rate_pct": benchmark_loss,
        "benchmark_source": source,
        "avg_selling_price_rwf_per_kg": _NATIONAL_PRICE.get(crop),
        "cause_of_loss_breakdown_pct": _NATIONAL_CAUSE.get(crop),
    }


def get_national_cause_breakdown(crop: str) -> Optional[Dict[str, float]]:
    """Return the national cause-of-loss breakdown for a crop, or None."""
    return _NATIONAL_CAUSE.get(crop)
