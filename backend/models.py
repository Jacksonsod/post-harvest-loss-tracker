"""
models.py

Pydantic request and response models for all API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


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

MIN_YEAR = 2000
MAX_YEAR = datetime.now().year + 1


def _check_year(v: Optional[int]) -> Optional[int]:
    if v is not None and not MIN_YEAR <= v <= MAX_YEAR:
        raise ValueError(f"year must be between {MIN_YEAR} and {MAX_YEAR}")
    return v


class AssessRequest(BaseModel):
    coop_id: int
    district: str
    crop: str
    season: Optional[str] = None
    harvested_qty_kg: float
    loss_by_cause_kg: Optional[Dict[str, float]] = None
    total_loss_kg: Optional[float] = None
    previous_assessment_action_taken: Optional[str] = None  # Task 3: free text
    year: Optional[int] = None                              # harvest year, when known

    @field_validator("season")
    @classmethod
    def validate_season(cls, v):
        if v is not None and v not in VALID_SEASONS:
            raise ValueError(f"season must be one of {sorted(VALID_SEASONS)}")
        return v

    @field_validator("year")
    @classmethod
    def validate_year(cls, v):
        return _check_year(v)


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
    season_year: Optional[int] = None
    dominant_cause_is_estimated: Optional[bool] = None
    import_batch_id: Optional[str] = None   # set when the row came from a dataset import

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


# ---------------------------------------------------------------------------
# /datasets — dataset import
# ---------------------------------------------------------------------------

MAX_IMPORT_ROWS = 1000


class AssessmentImportRow(BaseModel):
    """
    One harvest record from an imported file. Give either total_loss_kg or
    any of the loss_<cause>_kg columns (when both are given the per-cause sum
    is used, as in POST /assess).
    """
    cooperative_name: str = Field(..., min_length=2, max_length=200)
    district: str = Field(..., min_length=1)
    crop: str = Field(..., min_length=1)
    season: Optional[str] = None
    year: Optional[int] = None
    harvested_qty_kg: float = Field(..., gt=0)
    total_loss_kg: Optional[float] = Field(None, ge=0)
    loss_theft_kg: Optional[float] = Field(None, ge=0)
    loss_insects_pests_kg: Optional[float] = Field(None, ge=0)
    loss_birds_animals_kg: Optional[float] = Field(None, ge=0)
    loss_stalks_fallen_kg: Optional[float] = Field(None, ge=0)
    loss_harvesting_damage_kg: Optional[float] = Field(None, ge=0)
    loss_transport_kg: Optional[float] = Field(None, ge=0)
    loss_storage_kg: Optional[float] = Field(None, ge=0)
    loss_processing_kg: Optional[float] = Field(None, ge=0)
    loss_packaging_kg: Optional[float] = Field(None, ge=0)
    loss_sale_kg: Optional[float] = Field(None, ge=0)
    dominant_cause: Optional[str] = None
    action_taken: Optional[str] = Field(None, max_length=500)

    model_config = {"str_strip_whitespace": True}

    @field_validator("season")
    @classmethod
    def validate_season(cls, v):
        if v is None or v == "":
            return None
        v = v.upper()
        if v not in VALID_SEASONS:
            raise ValueError(f"season must be one of {sorted(VALID_SEASONS)}")
        return v

    @field_validator("year")
    @classmethod
    def validate_year(cls, v):
        return _check_year(v)

    @field_validator("dominant_cause")
    @classmethod
    def validate_cause(cls, v):
        if v is None or v == "":
            return None
        v = v.lower().replace(" ", "_").replace("-", "_").replace("/", "_")
        if v not in VALID_CAUSES:
            raise ValueError(f"dominant_cause must be one of {sorted(VALID_CAUSES)}")
        return v

    def loss_by_cause_kg(self) -> Optional[Dict[str, float]]:
        """The per-cause columns that were filled in, keyed by cause, or None if none were."""
        given = {
            cause: getattr(self, f"loss_{cause}_kg")
            for cause in sorted(VALID_CAUSES)
            if getattr(self, f"loss_{cause}_kg") is not None
        }
        return given or None


class AssessmentImportRequest(BaseModel):
    records: List[dict] = Field(..., min_length=1, max_length=MAX_IMPORT_ROWS)


class ImportRowResult(BaseModel):
    row: int                                   # spreadsheet row (header = row 1)
    status: Literal["ok", "error", "duplicate"]
    cooperative_name: Optional[str] = None
    district: Optional[str] = None
    crop: Optional[str] = None
    season: Optional[str] = None
    year: Optional[int] = None
    harvested_qty_kg: Optional[float] = None
    total_loss_kg: Optional[float] = None
    loss_rate_pct: Optional[float] = None
    benchmark_loss_rate_pct: Optional[float] = None
    benchmark_source: Optional[str] = None
    benchmark_n_records: Optional[int] = None
    high_volatility: bool = False
    volatility_share_total_loss_pct: Optional[float] = None
    risk_category: Optional[str] = None
    dominant_cause: Optional[str] = None
    dominant_cause_is_estimated: Optional[bool] = None
    recommendation: Optional[str] = None
    estimated_loss_value_rwf: Optional[float] = None
    cooperative_exists: Optional[bool] = None
    assessment_id: Optional[int] = None        # set after a real import
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ImportResultOut(BaseModel):
    status: Literal["preview", "imported", "failed"]
    dry_run: bool
    batch_id: Optional[str] = None
    total_received: int
    valid_count: int
    imported_count: int
    skipped_duplicates: int
    cooperatives_created: int                  # in a preview: would be created
    cooperatives_matched: int
    rows: List[ImportRowResult]
    errors: List[str]                          # flat "Row N: ..." list
    warnings: List[str]                        # file-level warnings (e.g. unknown columns)


class ImportUndoOut(BaseModel):
    batch_id: str
    assessments_deleted: int
    cooperatives_deleted: int


class ImportColumnItem(BaseModel):
    name: str
    required: bool
    type: str
    description: str
    example: Optional[str] = None


class ImportFormatOut(BaseModel):
    max_rows: int
    max_file_bytes: int
    columns: List[ImportColumnItem]
    rules: List[str]
