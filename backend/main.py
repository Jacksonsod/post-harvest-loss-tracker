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
"""

from __future__ import annotations

import json
from collections import Counter
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from assessment_service import (
    compute_cause_breakdown_pct,
    compute_estimated_loss_value,
    compute_risk_category,
    find_dominant_cause_from_input,
    find_dominant_cause_from_national,
    get_recommendation,
)
from benchmark_service import (
    get_national_cause_breakdown,
    get_options,
    get_overall_national_loss_rate,
    get_storage_comparison,
    lookup_benchmark,
)
from db import Assessment, Cooperative, get_db, init_db
from models import (
    AssessmentHistoryItem,
    AssessOut,
    AssessRequest,
    BenchmarkOut,
    CoopCreate,
    CoopOut,
    DispatchTriggerItem,
    DispatchTriggersOut,
    EstimateOut,
    OutlierItem,
    OutliersOut,
    PolicyAlignmentOut,
    StorageComparisonOut,
    StorageTypeItem,
    SummaryOut,
)

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
# Cited from Rwanda NST2, presented to Parliament August 2026.
# These are official figures — NOT derived from the survey data.
# ---------------------------------------------------------------------------

_NST2_BASELINE_2023_PCT: float = 13.8
_NST2_TARGET_2029_PCT: float = 5.0
_NST2_SOURCE: str = "Rwanda NST2 (presented to Parliament, August 2026)"


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
    # ---- 0. Validate harvested quantity ----
    if body.harvested_qty_kg <= 0:
        raise HTTPException(
            status_code=400,
            detail="harvested_qty_kg must be greater than 0.",
        )

    # ---- 1. Validate that at least one loss source is given ----
    if body.loss_by_cause_kg is None and body.total_loss_kg is None:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'loss_by_cause_kg' or 'total_loss_kg' (at least one is required).",
        )

    # ---- 2. Derive total_loss_kg ----
    if body.loss_by_cause_kg is not None:
        total_loss_kg = sum(body.loss_by_cause_kg.values())
    else:
        total_loss_kg = body.total_loss_kg  # type: ignore[assignment]

    # ---- 2b. Guard: loss cannot exceed harvested quantity ----
    if total_loss_kg > body.harvested_qty_kg:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Reported total loss ({total_loss_kg} kg) exceeds harvested "
                f"quantity ({body.harvested_qty_kg} kg). Check your inputs."
            ),
        )

    # ---- 3. Compute loss rate ----
    loss_rate_pct = round(total_loss_kg / body.harvested_qty_kg * 100, 2)

    # ---- 4. Benchmark lookup ----
    bm = lookup_benchmark(district=body.district, crop=body.crop, season=body.season)
    if bm is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No benchmark data found for district='{body.district}', crop='{body.crop}'"
                + (f", season='{body.season}'" if body.season else "")
                + ". Cannot complete assessment without a valid benchmark."
            ),
        )
    benchmark_loss_rate_pct: float = bm["benchmark_loss_rate_pct"]
    benchmark_source: str = bm["benchmark_source"]
    price_per_kg: Optional[float] = bm["avg_selling_price_rwf_per_kg"]

    # ---- 5. Risk category ----
    risk_category = compute_risk_category(loss_rate_pct, benchmark_loss_rate_pct)

    # ---- 6. Dominant cause + estimated flag ----
    dominant_cause_is_estimated = False
    if body.loss_by_cause_kg is not None:
        dominant_cause = find_dominant_cause_from_input(body.loss_by_cause_kg)
    else:
        national_breakdown = get_national_cause_breakdown(body.crop)
        dominant_cause = find_dominant_cause_from_national(national_breakdown)
        dominant_cause_is_estimated = True

    # ---- 7. Recommendation ----
    recommendation = get_recommendation(dominant_cause)

    # ---- 8. Economic translation ----
    estimated_loss_value_rwf = compute_estimated_loss_value(total_loss_kg, price_per_kg)

    # ---- 9. Per-assessment cause breakdown (only when loss_by_cause_kg given) ----
    cause_of_loss_breakdown_pct: Optional[dict] = None
    if body.loss_by_cause_kg is not None:
        cause_of_loss_breakdown_pct = compute_cause_breakdown_pct(
            body.loss_by_cause_kg, total_loss_kg
        )

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
        harvested_qty_kg=body.harvested_qty_kg,
        total_loss_kg=total_loss_kg,
        loss_rate_pct=loss_rate_pct,
        benchmark_used_pct=benchmark_loss_rate_pct,
        benchmark_source=benchmark_source,
        risk_category=risk_category,
        dominant_cause=dominant_cause,
        recommendation_text=recommendation,
        estimated_loss_value_rwf=estimated_loss_value_rwf,
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
        loss_rate_pct=loss_rate_pct,
        benchmark_loss_rate_pct=benchmark_loss_rate_pct,
        benchmark_source=benchmark_source,
        risk_category=risk_category,
        dominant_cause=dominant_cause,
        dominant_cause_is_estimated=dominant_cause_is_estimated,
        recommendation=recommendation,
        estimated_loss_value_rwf=estimated_loss_value_rwf,
        cause_of_loss_breakdown_pct=cause_of_loss_breakdown_pct,
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
        .order_by(Assessment.created_at.asc())
        .all()
    )
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
