"""
main.py

FastAPI application for the Cooperative Post-Harvest Loss Tracker.

Endpoints:
  GET  /health
  GET  /benchmark
  POST /coop
  GET  /coops
  POST /assess
  GET  /assessments/{coop_id}
"""

from __future__ import annotations

import json
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from assessment_service import (
    compute_cause_breakdown_pct,
    compute_estimated_loss_value,
    compute_risk_category,
    find_dominant_cause_from_input,
    find_dominant_cause_from_national,
    get_recommendation,
)
from benchmark_service import get_national_cause_breakdown, lookup_benchmark
from db import Assessment, Cooperative, get_session, init_db
from models import (
    AssessmentHistoryItem,
    AssessOut,
    AssessRequest,
    BenchmarkOut,
    CoopCreate,
    CoopOut,
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
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# GET /benchmark
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# POST /coop
# ---------------------------------------------------------------------------

@app.post("/coop", response_model=CoopOut, status_code=201)
def create_coop(body: CoopCreate):
    session = get_session()
    try:
        coop = Cooperative(name=body.name, district=body.district)
        session.add(coop)
        session.commit()
        session.refresh(coop)
        return CoopOut.model_validate(coop)
    finally:
        session.close()


# ---------------------------------------------------------------------------
# GET /coops
# ---------------------------------------------------------------------------

@app.get("/coops", response_model=List[CoopOut])
def list_coops():
    session = get_session()
    try:
        coops = session.query(Cooperative).all()
        return [CoopOut.model_validate(c) for c in coops]
    finally:
        session.close()


# ---------------------------------------------------------------------------
# POST /assess
# ---------------------------------------------------------------------------

@app.post("/assess", response_model=AssessOut, status_code=201)
def create_assessment(body: AssessRequest):
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
    session = get_session()
    try:
        coop = session.query(Cooperative).filter(Cooperative.id == body.coop_id).first()
        if coop is None:
            raise HTTPException(
                status_code=404,
                detail=f"Cooperative with id={body.coop_id} not found.",
            )

        # ---- 11. Persist assessment ----
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
        )
        session.add(assessment)
        session.commit()
        session.refresh(assessment)
        assessment_id = assessment.id
    finally:
        session.close()

    return AssessOut(
        assessment_id=assessment_id,
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


# ---------------------------------------------------------------------------
# GET /assessments/{coop_id}
# ---------------------------------------------------------------------------

@app.get("/assessments/{coop_id}", response_model=List[AssessmentHistoryItem])
def get_assessments(coop_id: int):
    session = get_session()
    try:
        coop = session.query(Cooperative).filter(Cooperative.id == coop_id).first()
        if coop is None:
            raise HTTPException(
                status_code=404,
                detail=f"Cooperative with id={coop_id} not found.",
            )
        assessments = (
            session.query(Assessment)
            .filter(Assessment.coop_id == coop_id)
            .order_by(Assessment.created_at.asc())
            .all()
        )
        return [AssessmentHistoryItem.model_validate(a) for a in assessments]
    finally:
        session.close()
