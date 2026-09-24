"""
assessment_service.py

Encapsulates the business logic for a POST /assess call:
  - compute loss_rate_pct
  - determine risk category
  - find dominant cause
  - map cause -> recommendation text
  - compute estimated_loss_value_rwf
  - compute per-assessment cause_of_loss_breakdown_pct
"""

from __future__ import annotations

from typing import Dict, Optional, Tuple

# ---------------------------------------------------------------------------
# Recommendation lookup table  (exact text per spec)
# ---------------------------------------------------------------------------
RECOMMENDATIONS: Dict[Optional[str], str] = {
    "theft": (
        "Consider community or shared storage with basic security measures, "
        "and review harvest timing to reduce time crops sit exposed in the field."
    ),
    "insects_pests": (
        "Consider proper drying before storage and appropriate pest control measures "
        "(e.g. hermetic storage bags) to reduce insect damage."
    ),
    "birds_animals": (
        "Consider netting or scarecrow measures during the vulnerable pre-harvest "
        "window, and review harvest timing."
    ),
    "stalks_fallen": (
        "Review harvesting technique and timing to reduce field losses from stalks "
        "falling before collection."
    ),
    "harvesting_damage": (
        "Consider training on proper harvesting technique and timing to reduce "
        "damage during harvest."
    ),
    "transport": (
        "Consider coordinating group transport with other members, or timing harvest "
        "closer to collection/transport availability."
    ),
    "storage": (
        "Consider improved storage — hermetic bags, raised platforms, or shared "
        "cooperative storage facilities — to reduce loss during storage."
    ),
    "processing": (
        "Consider improved processing equipment or technique to reduce losses "
        "during processing."
    ),
    "packaging": (
        "Consider improved packaging materials to reduce losses during packaging "
        "and handling."
    ),
    "sale": (
        "Consider reviewing the time between harvest and sale, and market timing, "
        "to reduce losses at the point of sale."
    ),
    None: "No dominant loss cause could be determined from the data provided.",
}


def compute_risk_category(loss_rate_pct: float, benchmark_loss_rate_pct: float) -> str:
    """
    Low   if loss_rate_pct <= benchmark * 0.85
    High  if loss_rate_pct >  benchmark * 1.15
    Medium otherwise
    """
    low_threshold = benchmark_loss_rate_pct * 0.85
    high_threshold = benchmark_loss_rate_pct * 1.15

    if loss_rate_pct <= low_threshold:
        return "Low"
    elif loss_rate_pct > high_threshold:
        return "High"
    else:
        return "Medium"


def find_dominant_cause_from_input(
    loss_by_cause_kg: Dict[str, float],
) -> Optional[str]:
    """
    Return the cause key with the maximum value.
    If every value is 0 (or the dict is empty), return None.
    """
    if not loss_by_cause_kg:
        return None
    max_val = max(loss_by_cause_kg.values())
    if max_val <= 0:
        return None
    return max(loss_by_cause_kg, key=lambda k: loss_by_cause_kg[k])


def find_dominant_cause_from_national(
    national_breakdown: Optional[Dict[str, float]],
) -> Optional[str]:
    """
    Fall back to the national cause with the highest percentage.
    Returns None if no breakdown is available.
    """
    if not national_breakdown:
        return None
    max_val = max(national_breakdown.values())
    if max_val <= 0:
        return None
    return max(national_breakdown, key=lambda k: national_breakdown[k])


def compute_cause_breakdown_pct(
    loss_by_cause_kg: Dict[str, float],
    total_loss_kg: float,
) -> Optional[Dict[str, float]]:
    """
    Given the per-cause kg values and total loss, compute each cause as a
    percentage of THIS ASSESSMENT's total loss.
    Returns None if total_loss_kg is <= 0 to avoid division by zero or negative percentages.
    """
    if total_loss_kg <= 0:
        return None
    return {
        cause: round(kg / total_loss_kg * 100, 2)
        for cause, kg in loss_by_cause_kg.items()
    }


def get_recommendation(cause: Optional[str]) -> str:
    return RECOMMENDATIONS.get(cause, RECOMMENDATIONS[None])


def compute_estimated_loss_value(
    total_loss_kg: float,
    price_per_kg: Optional[float],
) -> Optional[float]:
    if price_per_kg is None:
        return None
    return round(total_loss_kg * price_per_kg, 2)
