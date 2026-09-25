"""
models.py

Pydantic request and response models for all API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

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
    previous_assessment_action_taken: Optional[str] = None  # Task 3: free text

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
    action_notes: Optional[str] = None      # Task 3: what changed since last assessment
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# /estimate — GET response  (Task 1)
# ---------------------------------------------------------------------------

class EstimateOut(BaseModel):
    district: str
    crop: str
    season: str
    projected_harvest_kg: float
    benchmark_loss_rate_pct: float
    benchmark_source: str
    expected_loss_kg: float
    expected_loss_value_rwf: Optional[float]
    avg_selling_price_rwf_per_kg: Optional[float]


# ---------------------------------------------------------------------------
# /assess/{id}/summary — GET response  (Task 2)
# ---------------------------------------------------------------------------

class SummaryOut(BaseModel):
    assessment_id: int
    summary_text: str


# ---------------------------------------------------------------------------
# /overview/dispatch-triggers — GET response  (Task 4)
# ---------------------------------------------------------------------------

class DispatchTriggerItem(BaseModel):
    dominant_cause: str
    count: int
    suggested_intervention: str


class DispatchTriggersOut(BaseModel):
    district: Optional[str]           # None means "all districts"
    assessment_count: int
    dispatch_triggers: List[DispatchTriggerItem]


# ---------------------------------------------------------------------------
# /overview/outliers — GET response  (Task 5)
# ---------------------------------------------------------------------------

class OutlierItem(BaseModel):
    assessment_id: int
    coop_id: int
    district: Optional[str]
    crop: Optional[str]
    season: Optional[str]
    loss_rate_pct: float
    benchmark_used_pct: float
    deviation_ratio: float


class OutliersOut(BaseModel):
    outliers: List[OutlierItem]


# ---------------------------------------------------------------------------
# /overview/policy-alignment — GET response  (Task 6)
# ---------------------------------------------------------------------------

class PolicyAlignmentOut(BaseModel):
    national_baseline_2023_pct: float
    national_target_2029_pct: float
    source: str
    survey_derived_current_estimate_pct: float
    survey_derived_note: str


# ---------------------------------------------------------------------------
# /overview/storage-comparison — GET response  (Task 7)
# ---------------------------------------------------------------------------

class StorageTypeItem(BaseModel):
    storage_type: str
    avg_loss_rate_pct: float
    n_records: int


class StorageComparisonOut(BaseModel):
    crop: str
    storage_types: List[StorageTypeItem]
