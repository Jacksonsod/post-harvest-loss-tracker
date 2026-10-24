"""
Contract tests for the API.

Part 1 checks that every pre-existing endpoint keeps its fields and status
codes (stand-in for the Postman collection). Part 2 checks the additive
endpoints and fields against values verified directly in
data/processed/benchmarks.json.

Run from backend/:  python -m pytest -q
"""

import sqlite3

from fastapi.testclient import TestClient

from db import Base, engine, init_db
from main import app

MAIZE_BY_CAUSE = {"insects_pests": 120, "theft": 60, "transport": 20}


def _new_coop(client, name="Test Coop", district="Nyagatare"):
    r = client.post("/coop", json={"name": name, "district": district})
    assert r.status_code == 201
    return r.json()


def _assess(client, coop_id, **overrides):
    body = {
        "coop_id": coop_id, "district": "Nyagatare", "crop": "Maize", "season": "A",
        "harvested_qty_kg": 1000, "loss_by_cause_kg": MAIZE_BY_CAUSE,
    }
    body.update(overrides)
    return client.post("/assess", json=body)


# ===========================================================================
# Part 1 — existing contracts are unchanged
# ===========================================================================

def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_options(client):
    body = client.get("/options").json()
    assert len(body["districts"]) == 30
    assert len(body["crops"]) == 21
    assert body["districts"] == sorted(body["districts"])


def test_benchmark_existing_fields(client):
    r = client.get("/benchmark", params={"district": "Nyagatare", "crop": "Maize", "season": "A"})
    assert r.status_code == 200
    body = r.json()
    for key in ("district", "crop", "season", "benchmark_loss_rate_pct", "benchmark_source",
                "avg_selling_price_rwf_per_kg", "cause_of_loss_breakdown_pct"):
        assert key in body
    assert body["benchmark_source"] == "district_season"


def test_benchmark_fallbacks(client):
    r = client.get("/benchmark", params={"district": "Nyagatare", "crop": "Maize"})
    assert r.json()["benchmark_source"] == "district"


def test_benchmark_404(client):
    r = client.get("/benchmark", params={"district": "Nowhere", "crop": "Nothing"})
    assert r.status_code == 404


def test_estimate(client):
    r = client.get("/estimate", params={"district": "Nyagatare", "crop": "Maize", "season": "A",
                                        "projected_harvest_kg": 1000})
    assert r.status_code == 200
    body = r.json()
    assert body["expected_loss_kg"] == 177.2
    for key in ("benchmark_loss_rate_pct", "benchmark_source", "expected_loss_value_rwf",
                "avg_selling_price_rwf_per_kg"):
        assert key in body


def test_estimate_errors(client):
    base = {"district": "Nyagatare", "crop": "Maize", "season": "A"}
    assert client.get("/estimate", params={**base, "projected_harvest_kg": 0}).status_code == 400
    assert client.get("/estimate", params={**base, "crop": "Nothing",
                                           "projected_harvest_kg": 10}).status_code == 404


def test_coop_create_and_list(client):
    coop = _new_coop(client)
    assert {"id", "name", "district", "created_at"} <= coop.keys()
    coops = client.get("/coops").json()
    assert [c["id"] for c in coops] == [coop["id"]]


def test_assess_by_cause(client):
    coop = _new_coop(client)
    r = _assess(client, coop["id"])
    assert r.status_code == 201
    body = r.json()
    assert body["loss_rate_pct"] == 20.0
    assert body["dominant_cause"] == "insects_pests"
    assert body["dominant_cause_is_estimated"] is False
    for key in ("assessment_id", "benchmark_loss_rate_pct", "benchmark_source", "risk_category",
                "recommendation", "estimated_loss_value_rwf", "cause_of_loss_breakdown_pct"):
        assert key in body


def test_assess_total_only(client):
    coop = _new_coop(client)
    body = _assess(client, coop["id"], loss_by_cause_kg=None, total_loss_kg=180).json()
    assert body["dominant_cause_is_estimated"] is True
    assert body["cause_of_loss_breakdown_pct"] is None


def test_assess_errors(client):
    coop = _new_coop(client)
    assert _assess(client, coop["id"], loss_by_cause_kg=None).status_code == 400
    assert _assess(client, coop["id"], harvested_qty_kg=0).status_code == 400
    assert _assess(client, coop["id"], harvested_qty_kg=100).status_code == 400  # loss > harvest
    assert _assess(client, 9999).status_code == 404
    assert _assess(client, coop["id"], season="Z").status_code == 422


def test_summary_and_history(client):
    coop = _new_coop(client)
    aid = _assess(client, coop["id"]).json()["assessment_id"]
    summary = client.get(f"/assess/{aid}/summary").json()
    assert "MAIZE - NYAGATARE - Season A" in summary["summary_text"]
    assert client.get("/assess/9999/summary").status_code == 404

    history = client.get(f"/assessments/{coop['id']}").json()
    assert len(history) == 1 and history[0]["id"] == aid
    assert client.get("/assessments/9999").status_code == 404


def test_dispatch_triggers_and_outliers(client):
    coop = _new_coop(client)
    _assess(client, coop["id"], harvested_qty_kg=500)  # 40% vs 17.72 → outlier
    triggers = client.get("/overview/dispatch-triggers").json()
    assert triggers["assessment_count"] == 1
    assert triggers["dispatch_triggers"][0]["dominant_cause"] == "insects_pests"
    outliers = client.get("/overview/outliers").json()["outliers"]
    assert len(outliers) == 1


def test_policy_alignment(client):
    body = client.get("/overview/policy-alignment").json()
    assert body["national_baseline_2023_pct"] == 13.8
    assert body["national_target_2029_pct"] == 5.0
    assert body["survey_derived_current_estimate_pct"] == 10.22


def test_storage_comparison(client):
    assert client.get("/overview/storage-comparison", params={"crop": "Maize"}).status_code == 200
    assert client.get("/overview/storage-comparison", params={"crop": "Nothing"}).status_code == 404


# ===========================================================================
# Part 2 — additive endpoints and fields (values from benchmarks.json)
# ===========================================================================

def test_b1_benchmark_sample_size(client):
    body = client.get("/benchmark", params={"district": "Nyagatare", "crop": "Maize", "season": "A"}).json()
    assert body["benchmark_loss_rate_pct"] == 17.72
    assert body["benchmark_n_records"] == 1004
    assert body["high_volatility"] is False
    assert body["volatility_share_total_loss_pct"] is None


def test_b1_benchmark_volatility(client):
    body = client.get("/benchmark", params={"district": "Kayonza", "crop": "Paddy rice", "season": "A"}).json()
    assert body["high_volatility"] is True
    assert body["volatility_share_total_loss_pct"] == 17.2


def test_b1_musanze_irish_potato(client):
    body = client.get("/benchmark", params={"district": "Musanze", "crop": "Irish potato", "season": "A"}).json()
    assert body["benchmark_loss_rate_pct"] == 12.7
    assert body["benchmark_n_records"] == 197


def test_b1_volatility_only_at_district_season(client):
    body = client.get("/benchmark", params={"district": "Kayonza", "crop": "Paddy rice"}).json()
    assert body["benchmark_source"] == "district"
    assert body["high_volatility"] is False


def test_b1_estimate_and_assess(client):
    est = client.get("/estimate", params={"district": "Nyagatare", "crop": "Maize", "season": "A",
                                          "projected_harvest_kg": 1000}).json()
    assert est["benchmark_n_records"] == 1004
    coop = _new_coop(client, district="Kayonza")
    body = _assess(client, coop["id"], district="Kayonza", crop="Paddy rice").json()
    assert body["benchmark_n_records"] == 29
    assert body["high_volatility"] is True


def test_b2_national_summary(client):
    body = client.get("/overview/national-summary").json()
    assert body["overall_avg_loss_rate_pct"] == 10.22
    assert body["n_records"] == 134766
    assert body["n_records_with_loss"] == 37894
    assert body["share_records_with_loss_pct"] == 28.1
    assert body["n_districts"] == 30
    assert body["n_crop_categories"] == 21
    assert body["survey_years"] == [2024, 2025]
    assert body["season_overall"] == {
        "A": {"avg_loss_rate_pct": 11.92, "n_records": 64290},
        "B": {"avg_loss_rate_pct": 8.62, "n_records": 66644},
        "C": {"avg_loss_rate_pct": 7.37, "n_records": 1949},
    }
    assert body["cause_breakdown_all_crops_pct"] == {
        "harvesting_damage": 24.2, "insects_pests": 24.0, "stalks_fallen": 14.2,
        "processing": 13.0, "birds_animals": 11.7, "theft": 7.1, "transport": 3.8,
        "sale": 1.0, "packaging": 0.9, "storage": 0.2,
    }
    top = body["top_districts"]
    assert len(top) == 5
    assert [t["district"] for t in top[:3]] == ["Nyagatare", "Kamonyi", "Gatsibo"]
    assert top[0] == {"district": "Nyagatare", "avg_loss_rate_pct": 15.76, "n_records": 6472}
    assert body["nst2"] == {"baseline_2023_pct": 13.8, "target_2029_pct": 5.0,
                            "source": "Rwanda NST2 (presented to Parliament, August 2026)"}


def test_b3_map_no_filters(client):
    body = client.get("/overview/map").json()
    assert body["national_reference_pct"] == 10.22
    districts = body["districts"]
    assert len(districts) == 30
    assert districts[0]["district"] == "Nyagatare" and districts[0]["avg_loss_rate_pct"] == 15.76
    assert [d["district"] for d in districts[-3:]] == ["Burera", "Muhanga", "Rwamagana"]
    assert districts[-1]["avg_loss_rate_pct"] == 4.35
    assert body["districts_without_data"] == []


def test_b3_map_season(client):
    body = client.get("/overview/map", params={"season": "A"}).json()
    assert body["national_reference_pct"] == 11.92
    assert len(body["districts"]) + len(body["districts_without_data"]) == 30


def test_b3_map_season_and_crop(client):
    body = client.get("/overview/map", params={"season": "A", "crop": "Maize"}).json()
    assert body["national_reference_pct"] == 13.43
    nyagatare = next(d for d in body["districts"] if d["district"] == "Nyagatare")
    assert nyagatare == {"district": "Nyagatare", "avg_loss_rate_pct": 17.72, "n_records": 1004,
                         "above_reference": True, "high_volatility": False}

    rice = client.get("/overview/map", params={"season": "A", "crop": "Paddy rice"}).json()
    kayonza = next(d for d in rice["districts"] if d["district"] == "Kayonza")
    assert kayonza["high_volatility"] is True


def test_b3_map_sparse_crop(client):
    body = client.get("/overview/map", params={"crop": "Wheat"}).json()
    assert len(body["districts"]) == 10
    assert len(body["districts_without_data"]) == 20
    assert all(d["avg_loss_rate_pct"] is not None for d in body["districts"])


def test_b3_map_validation(client):
    assert client.get("/overview/map", params={"season": "X"}).status_code == 422
    assert client.get("/overview/map", params={"crop": "Nothing"}).status_code == 404


def test_b4_by_crop(client):
    national = client.get("/overview/by-crop").json()["crops"]
    assert len(national) == 21
    maize = next(c for c in national if c["crop"] == "Maize")
    assert maize["avg_loss_rate_pct"] == 13.43
    assert maize["dominant_cause"] == "processing"
    rates = [c["avg_loss_rate_pct"] for c in national]
    assert rates == sorted(rates, reverse=True)

    local = client.get("/overview/by-crop", params={"district": "Nyagatare", "season": "A"}).json()
    assert next(c for c in local["crops"] if c["crop"] == "Maize")["n_records"] == 1004

    assert client.get("/overview/by-crop", params={"season": "A"}).status_code == 400
    assert client.get("/overview/by-crop", params={"district": "Nowhere"}).status_code == 404


def test_b4_top_risk(client):
    body = client.get("/overview/top-risk").json()
    groups = body["groups"]
    assert body["min_records"] == 30
    assert len(groups) == 10
    assert all(g["n_records"] >= 30 for g in groups)
    rates = [g["avg_loss_rate_pct"] for g in groups]
    assert rates == sorted(rates, reverse=True)

    seasonal = client.get("/overview/top-risk", params={"season": "A", "limit": 50, "min_records": 5}).json()
    assert all(g["season"] == "A" for g in seasonal["groups"])
    assert client.get("/overview/top-risk", params={"limit": 0}).status_code == 422


def test_b4_pooled_rows_flag_volatile_seasons(client):
    """Kayonza paddy rice is volatile in Season A, so its pooled figure carries the caution."""
    groups = client.get("/overview/top-risk").json()["groups"]
    kayonza = next(g for g in groups if g["district"] == "Kayonza" and g["crop"] == "Paddy rice")
    assert kayonza["high_volatility"] is True

    rice = client.get("/overview/map", params={"crop": "Paddy rice"}).json()
    assert next(d for d in rice["districts"] if d["district"] == "Kayonza")["high_volatility"] is True


def test_b5_about_data(client):
    body = client.get("/about-data").json()
    assert body["metadata"]["n_records"] == 134766
    assert any("25%" in s for s in body["methodology"])
    assert any("AUC 0.59" in s for s in body["methodology"])
    assert any("geoBoundaries" in s["name"] for s in body["sources"])


def test_b5_methodology_matches_data_md():
    import os
    from about_data import METHODOLOGY
    path = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "DATA.md")
    text = open(path, encoding="utf-8").read().replace("`", "")
    for sentence in METHODOLOGY:
        assert sentence in text, sentence


# ---------------------------------------------------------------------------
# B6 — labelled sample data
# ---------------------------------------------------------------------------

def test_b6_seed_on_startup_is_idempotent(fresh_db, monkeypatch):
    monkeypatch.setenv("SEED_DEMO", "true")
    with TestClient(app) as c:
        coops = c.get("/coops").json()
    with TestClient(app) as c:  # second start must not duplicate
        assert c.get("/coops").json() == coops

    assert len(coops) == 3
    assert all(c["is_sample"] is True for c in coops)
    assert all(c["name"].startswith("Sample Cooperative") for c in coops)


def test_b6_seed_risks_come_from_real_benchmarks(fresh_db, monkeypatch):
    monkeypatch.setenv("SEED_DEMO", "true")
    with TestClient(app) as c:
        by_name = {coop["name"]: coop["id"] for coop in c.get("/coops").json()}
        history = {name: c.get(f"/assessments/{cid}").json() for name, cid in by_name.items()}

    bugesera = history["Sample Cooperative — Bugesera"]
    burera = history["Sample Cooperative — Burera"]
    nyagatare = history["Sample Cooperative — Nyagatare"]
    assert [a["risk_category"] for a in bugesera] == ["Low"]
    assert [a["risk_category"] for a in burera] == ["High", "Low"]
    assert burera[0]["dominant_cause"] == "storage"
    assert burera[1]["action_notes"] == "Switched to hermetic storage bags"
    assert [a["risk_category"] for a in nyagatare] == ["Medium"]
    assert nyagatare[0]["benchmark_used_pct"] == 17.72


def test_b6_no_seed_without_flag(client):
    assert client.get("/coops").json() == []


def test_b6_user_created_coop_is_not_sample(client):
    assert _new_coop(client)["is_sample"] is False


def test_b6_migrates_old_database():
    """An app.db created before is_sample existed gains the column, rows default to false."""
    Base.metadata.drop_all(bind=engine)
    conn = sqlite3.connect(str(engine.url).replace("sqlite:///", ""))
    conn.execute("CREATE TABLE cooperatives (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, "
                 "district VARCHAR NOT NULL, created_at DATETIME)")
    conn.execute("INSERT INTO cooperatives (name, district) VALUES ('Old Coop', 'Huye')")
    conn.commit()
    conn.close()

    init_db()
    with TestClient(app) as c:
        coops = c.get("/coops").json()
    assert coops == [{"id": 1, "name": "Old Coop", "district": "Huye",
                      "is_sample": False, "created_at": None}]
