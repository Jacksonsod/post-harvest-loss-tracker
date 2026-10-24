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
    is_sample: bool = False             # True for clearly labelled demo cooperatives
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
    benchmark_n_records: Optional[int] = None          # sample size at benchmark_source level
    high_volatility: bool = False                      # district_season level only
    volatility_share_total_loss_pct: Optional[float] = None


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
    benchmark_n_records: Optional[int] = None
    high_volatility: bool = False
    volatility_share_total_loss_pct: Optional[float] = None


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
    benchmark_n_records: Optional[int] = None


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


# ---------------------------------------------------------------------------
# /overview/national-summary — GET response
# ---------------------------------------------------------------------------

class SeasonOverallItem(BaseModel):
    avg_loss_rate_pct: float
    n_records: int


class TopDistrictItem(BaseModel):
    district: str
    avg_loss_rate_pct: float
    n_records: int


class Nst2Block(BaseModel):
    baseline_2023_pct: float
    target_2029_pct: float
    source: str


class NationalSummaryOut(BaseModel):
    overall_avg_loss_rate_pct: float
    n_records: Optional[int]
    n_records_with_loss: Optional[int]
    share_records_with_loss_pct: Optional[float]
    n_districts: Optional[int]
    n_crop_categories: Optional[int]
    survey_years: List[int]
    season_overall: Dict[str, SeasonOverallItem]
    cause_breakdown_all_crops_pct: Dict[str, float]
    top_districts: List[TopDistrictItem]
    nst2: Nst2Block


# ---------------------------------------------------------------------------
# /overview/map — GET response
# ---------------------------------------------------------------------------

class MapDistrictItem(BaseModel):
    district: str
    avg_loss_rate_pct: float
    n_records: Optional[int]
    above_reference: bool
    high_volatility: bool


class MapOut(BaseModel):
    season: Optional[str]
    crop: Optional[str]
    national_reference_pct: Optional[float]
    districts: List[MapDistrictItem]
    districts_without_data: List[str]


# ---------------------------------------------------------------------------
# /overview/by-crop — GET response
# ---------------------------------------------------------------------------

class ByCropItem(BaseModel):
    crop: str
    avg_loss_rate_pct: float
    n_records: Optional[int]
    national_reference_pct: Optional[float]
    avg_selling_price_rwf_per_kg: Optional[float]
    dominant_cause: Optional[str]


class ByCropOut(BaseModel):
    district: Optional[str]
    season: Optional[str]
    crops: List[ByCropItem]


# ---------------------------------------------------------------------------
# /overview/top-risk — GET response
# ---------------------------------------------------------------------------

class TopRiskItem(BaseModel):
    district: str
    season: Optional[str]
    crop: str
    avg_loss_rate_pct: float
    n_records: int
    national_reference_pct: Optional[float]
    ratio_to_national: Optional[float]
    high_volatility: bool


class TopRiskOut(BaseModel):
    season: Optional[str]
    min_records: int
    groups: List[TopRiskItem]


# ---------------------------------------------------------------------------
# /about-data — GET response
# ---------------------------------------------------------------------------

class DataSourceItem(BaseModel):
    name: str
    url: Optional[str] = None
    note: Optional[str] = None


class AboutDataOut(BaseModel):
    metadata: dict
    methodology: List[str]
    sources: List[DataSourceItem]
