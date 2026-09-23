"""
models.py

Pydantic request and response models for all API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# /coop — POST request / response
# ---------------------------------------------------------------------------

class CoopCreate(BaseModel):
    name: str
    district: str


class CoopOut(BaseModel):
    id: int
    name: str
    district: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# /benchmark — GET response
# ---------------------------------------------------------------------------

class BenchmarkOut(BaseModel):
    district: str
    crop: str
    season: Optional[str] = None
    benchmark_loss_rate_pct: float
    benchmark_source: str           # "district_season" | "district" | "national"
    avg_selling_price_rwf_per_kg: Optional[float] = None
    cause_of_loss_breakdown_pct: Optional[Dict[str, float]] = None


# ---------------------------------------------------------------------------
# /assess — POST request
# ---------------------------------------------------------------------------

VALID_CAUSES = {
    "theft", "insects_pests", "birds_animals", "stalks_fallen",
    "harvesting_damage", "transport", "storage", "processing",
    "packaging", "sale",
}

VALID_SEASONS = {"A", "B", "C"}


class AssessRequest(BaseModel):
    coop_id: int
    district: str
    crop: str
    season: Optional[str] = None
    harvested_qty_kg: float
    loss_by_cause_kg: Optional[Dict[str, float]] = None
    total_loss_kg: Optional[float] = None

    @field_validator("season")
    @classmethod
    def validate_season(cls, v):
        if v is not None and v not in VALID_SEASONS:
            raise ValueError(f"season must be one of {sorted(VALID_SEASONS)}")
        return v


# ---------------------------------------------------------------------------
# /assess — POST response
# ---------------------------------------------------------------------------

class AssessOut(BaseModel):
    assessment_id: int
    loss_rate_pct: float
    benchmark_loss_rate_pct: float
    benchmark_source: str
    risk_category: str
    dominant_cause: Optional[str]
    dominant_cause_is_estimated: bool
    recommendation: str
    estimated_loss_value_rwf: Optional[float]
    cause_of_loss_breakdown_pct: Optional[Dict[str, float]] = None


# ---------------------------------------------------------------------------
# /assessments/{coop_id} — GET response item
# ---------------------------------------------------------------------------

class AssessmentHistoryItem(BaseModel):
    id: int
    coop_id: int
    district: Optional[str]
    crop: Optional[str]
    season: Optional[str]
    harvested_qty_kg: Optional[float]
    total_loss_kg: Optional[float]
    loss_rate_pct: Optional[float]
    benchmark_used_pct: Optional[float]
    benchmark_source: Optional[str]
    risk_category: Optional[str]
    dominant_cause: Optional[str]
    recommendation_text: Optional[str]
    estimated_loss_value_rwf: Optional[float]
    cause_breakdown_json: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
