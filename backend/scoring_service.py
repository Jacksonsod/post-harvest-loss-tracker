"""
scoring_service.py

The single scoring path shared by POST /assess and the dataset import, so an
imported record and a hand-entered one with the same inputs always get the
same loss rate, benchmark, risk category, recommendation and RWF value.

score_assessment() performs no database work. Invalid input raises
ScoringError carrying the HTTP status and message POST /assess returns.
"""

from __future__ import annotations

from typing import Dict, Optional

from assessment_service import (
    compute_cause_breakdown_pct,
    compute_estimated_loss_value,
    compute_risk_category,
    find_dominant_cause_from_input,
    find_dominant_cause_from_national,
    get_recommendation,
)
from benchmark_service import get_national_cause_breakdown, lookup_benchmark


class ScoringError(ValueError):
    """Invalid assessment input; status_code/detail map directly to an HTTP error."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def score_assessment(
    district: str,
    crop: str,
    season: Optional[str],
    harvested_qty_kg: float,
    loss_by_cause_kg: Optional[Dict[str, float]] = None,
    total_loss_kg: Optional[float] = None,
    reported_dominant_cause: Optional[str] = None,
) -> dict:
    """
    Compute every derived field of an assessment.

    Dominant cause, in order of preference:
      1. the largest entry of loss_by_cause_kg (not estimated)
      2. reported_dominant_cause, when only a total is given (not estimated)
      3. the national top cause for the crop (estimated)
    """
    # ---- 0. Validate harvested quantity ----
    if harvested_qty_kg <= 0:
        raise ScoringError(400, "harvested_qty_kg must be greater than 0.")

    # ---- 1. Validate that at least one loss source is given ----
    if loss_by_cause_kg is None and total_loss_kg is None:
        raise ScoringError(
            400,
            "Provide either 'loss_by_cause_kg' or 'total_loss_kg' (at least one is required).",
        )

    # ---- 2. Derive total_loss_kg ----
    if loss_by_cause_kg is not None:
        total_loss_kg = sum(loss_by_cause_kg.values())

    # ---- 2b. Guard: loss cannot exceed harvested quantity ----
    if total_loss_kg > harvested_qty_kg:
        raise ScoringError(
            400,
            f"Reported total loss ({total_loss_kg} kg) exceeds harvested "
            f"quantity ({harvested_qty_kg} kg). Check your inputs.",
        )

    # ---- 3. Compute loss rate ----
    loss_rate_pct = round(total_loss_kg / harvested_qty_kg * 100, 2)

    # ---- 4. Benchmark lookup ----
    bm = lookup_benchmark(district=district, crop=crop, season=season)
    if bm is None:
        raise ScoringError(
            404,
            f"No benchmark data found for district='{district}', crop='{crop}'"
            + (f", season='{season}'" if season else "")
            + ". Cannot complete assessment without a valid benchmark.",
        )
    benchmark_loss_rate_pct: float = bm["benchmark_loss_rate_pct"]

    # ---- 5. Risk category ----
    risk_category = compute_risk_category(loss_rate_pct, benchmark_loss_rate_pct)

    # ---- 6. Dominant cause + estimated flag ----
    dominant_cause_is_estimated = False
    if loss_by_cause_kg is not None:
        dominant_cause = find_dominant_cause_from_input(loss_by_cause_kg)
    elif reported_dominant_cause is not None:
        dominant_cause = reported_dominant_cause
    else:
        dominant_cause = find_dominant_cause_from_national(get_national_cause_breakdown(crop))
        dominant_cause_is_estimated = True

    # ---- 7-9. Recommendation, economic translation, per-assessment breakdown ----
    return {
        "total_loss_kg": total_loss_kg,
        "loss_rate_pct": loss_rate_pct,
        "benchmark_loss_rate_pct": benchmark_loss_rate_pct,
        "benchmark_source": bm["benchmark_source"],
        "benchmark_n_records": bm["benchmark_n_records"],
        "high_volatility": bm["high_volatility"],
        "volatility_share_total_loss_pct": bm["volatility_share_total_loss_pct"],
        "risk_category": risk_category,
        "dominant_cause": dominant_cause,
        "dominant_cause_is_estimated": dominant_cause_is_estimated,
        "recommendation": get_recommendation(dominant_cause),
        "estimated_loss_value_rwf": compute_estimated_loss_value(
            total_loss_kg, bm["avg_selling_price_rwf_per_kg"]
        ),
        "cause_of_loss_breakdown_pct": (
            compute_cause_breakdown_pct(loss_by_cause_kg, total_loss_kg)
            if loss_by_cause_kg is not None
            else None
        ),
    }
