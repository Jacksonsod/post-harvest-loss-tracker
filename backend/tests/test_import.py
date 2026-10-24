"""
Tests for the dataset import (/datasets/...).

Run from backend/:  python -m pytest -q
"""

from fastapi.testclient import TestClient

from main import app

HEADER = "cooperative_name,district,crop,season,year,harvested_qty_kg,total_loss_kg,dominant_cause,action_taken"
FIVE_ROWS = "\n".join([
    HEADER,
    "Example Coop One,Nyagatare,Maize,B,2025,1000,120,,",
    "Example Coop One,Nyagatare,Maize,A,2024,1000,200,storage,",
    "Example Coop One,Nyagatare,Maize,A,2025,1000,150,,Hermetic bags",
    "Example Coop Two,Burera,Maize,A,2025,1500,150,,",
    "Example Coop Two,Burera,Bush bean,B,2025,800,40,,",
]) + "\n"


def _upload(client, text, dry_run=False, filename="data.csv", encoding="utf-8"):
    return client.post(
        "/datasets/import-assessments/file",
        params={"dry_run": str(dry_run).lower()},
        files={"file": (filename, text.encode(encoding), "text/csv")},
    )


def _coop_count(client):
    return len(client.get("/coops").json())


# ---------------------------------------------------------------------------
# Template and format
# ---------------------------------------------------------------------------

def test_template_downloads_and_previews_ok(client):
    r = client.get("/datasets/import-template")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]

    preview = _upload(client, r.text, dry_run=True).json()
    assert preview["status"] == "preview"
    assert [row["status"] for row in preview["rows"]] == ["ok"]
    assert preview["rows"][0]["risk_category"] == "Low"  # 12% vs Nyagatare/A/Maize 17.72


def test_format_lists_every_column(client):
    body = client.get("/datasets/import-format").json()
    names = [c["name"] for c in body["columns"]]
    assert names[:3] == ["cooperative_name", "district", "crop"]
    assert "loss_insects_pests_kg" in names
    assert body["max_rows"] == 1000


# ---------------------------------------------------------------------------
# Same numbers as POST /assess
# ---------------------------------------------------------------------------

def test_import_matches_assess_exactly(client):
    csv_text = (
        "cooperative_name,district,crop,season,harvested_qty_kg,loss_storage_kg,loss_theft_kg\n"
        "Example Parity Coop,Kayonza,Paddy rice,A,2000,300,100\n"
    )
    imported = _upload(client, csv_text).json()["rows"][0]

    coop = client.post("/coop", json={"name": "Manual", "district": "Kayonza"}).json()
    manual = client.post("/assess", json={
        "coop_id": coop["id"], "district": "Kayonza", "crop": "Paddy rice", "season": "A",
        "harvested_qty_kg": 2000, "loss_by_cause_kg": {"storage": 300, "theft": 100},
    }).json()

    for field in ("loss_rate_pct", "benchmark_loss_rate_pct", "benchmark_source", "benchmark_n_records",
                  "high_volatility", "volatility_share_total_loss_pct", "risk_category",
                  "dominant_cause", "dominant_cause_is_estimated", "recommendation",
                  "estimated_loss_value_rwf"):
        assert imported[field] == manual[field], field


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def test_semicolon_bom_and_case_insensitive_names(client):
    text = "﻿" + (
        "Cooperative_Name;District;Crop;Season;Harvested_Qty_Kg;Total_Loss_Kg\n"
        "Example Coop;nyagatare;irish potato;a;500;50\n"
    )
    body = _upload(client, text).json()
    row = body["rows"][0]
    assert body["status"] == "imported"
    assert (row["district"], row["crop"], row["season"]) == ("Nyagatare", "Irish potato", "A")


def test_windows_1252_file(client):
    text = HEADER + "\nCoopérative Exemple,Huye,Maize,A,2025,1000,100,,\n"
    body = _upload(client, text, encoding="cp1252").json()
    assert body["rows"][0]["cooperative_name"] == "Coopérative Exemple"


def test_decimal_comma_gets_a_hint(client):
    text = '{}\nExample Coop,Huye,Maize,A,2025,"1,200",100,,\n'.format(HEADER)
    body = _upload(client, text, dry_run=True).json()
    assert "use a dot for decimals" in body["errors"][0]


def test_unknown_columns_warn_and_missing_required_fail(client):
    body = _upload(client, HEADER + ",notes\nExample Coop,Huye,Maize,A,2025,1000,100,,,hello\n", dry_run=True).json()
    assert body["warnings"] == ["Ignored unknown column(s): notes."]

    r = _upload(client, "cooperative_name,district\nExample Coop,Huye\n")
    assert r.status_code == 422
    assert "Missing required column(s): crop, harvested_qty_kg" in r.json()["detail"]


def test_blank_rows_are_skipped(client):
    body = _upload(client, FIVE_ROWS + ",,,,,,,,\n\n", dry_run=True).json()
    assert body["total_received"] == 5


# ---------------------------------------------------------------------------
# Preview and all-or-nothing
# ---------------------------------------------------------------------------

def test_dry_run_saves_nothing(client):
    body = _upload(client, FIVE_ROWS, dry_run=True).json()
    assert body["status"] == "preview"
    assert body["valid_count"] == 5
    assert body["cooperatives_created"] == 2
    assert body["batch_id"] is None
    assert _coop_count(client) == 0


def test_one_bad_row_saves_nothing(client):
    bad = FIVE_ROWS.replace("Burera,Bush bean", "Nyagatere,Bush bean")
    r = _upload(client, bad)
    assert r.status_code == 422
    body = r.json()
    assert body["status"] == "failed"
    assert body["errors"] == ["Row 6: Unknown district 'Nyagatere'. Use a district name from GET /options."]
    assert _coop_count(client) == 0


def test_validation_errors_are_per_row(client):
    text = HEADER + "\nExample Coop,Huye,Maize,Z,2025,0,100,,\nExample Coop,Huye,Maize,A,2025,100,500,,\n"
    body = _upload(client, text, dry_run=True).json()
    row2, row3 = body["rows"]
    assert any(e.startswith("season:") for e in row2["errors"])
    assert any(e.startswith("harvested_qty_kg:") for e in row2["errors"])
    assert "exceeds harvested quantity" in row3["errors"][0]


def test_json_records(client):
    r = client.post("/datasets/import-assessments", json={"records": [
        {"cooperative_name": "Example Json Coop", "district": "Musanze", "crop": "Irish potato",
         "season": "A", "harvested_qty_kg": 15000, "total_loss_kg": 1200, "dominant_cause": "storage"},
    ]})
    assert r.status_code == 201
    row = r.json()["rows"][0]
    assert row["row"] == 2
    assert row["dominant_cause"] == "storage"
    assert row["dominant_cause_is_estimated"] is False


def test_json_limits(client):
    assert client.post("/datasets/import-assessments", json={"records": []}).status_code == 422
    too_many = [{"cooperative_name": "x"}] * 1001
    assert client.post("/datasets/import-assessments", json={"records": too_many}).status_code == 422


# ---------------------------------------------------------------------------
# Duplicates and history order
# ---------------------------------------------------------------------------

def test_reupload_is_a_no_op(client):
    first = _upload(client, FIVE_ROWS)
    assert first.status_code == 201
    assert first.json()["imported_count"] == 5

    second = _upload(client, FIVE_ROWS)
    assert second.status_code == 200
    body = second.json()
    assert body["imported_count"] == 0
    assert body["skipped_duplicates"] == 5
    assert _coop_count(client) == 2


def test_duplicate_within_file_is_skipped(client):
    text = HEADER + "\nExample Coop,Huye,Maize,A,2025,1000,100,,\nexample  coop,Huye,Maize,A,2025,1000,100,,\n"
    body = _upload(client, text).json()
    assert body["imported_count"] == 1
    assert body["rows"][1]["status"] == "duplicate"
    assert "Same record as row 2" in body["rows"][1]["warnings"][0]


def test_history_is_chronological(client):
    _upload(client, FIVE_ROWS)
    coop = next(c for c in client.get("/coops").json() if c["name"] == "Example Coop One")
    history = client.get(f"/assessments/{coop['id']}").json()
    assert [(a["season_year"], a["season"]) for a in history] == [(2024, "A"), (2025, "A"), (2025, "B")]
    assert history[1]["action_notes"] == "Hermetic bags"
    assert all(a["import_batch_id"] for a in history)


def test_rows_join_existing_cooperative(client):
    existing = client.post("/coop", json={"name": "Example Coop One", "district": "Nyagatare"}).json()
    body = _upload(client, FIVE_ROWS).json()
    assert body["cooperatives_matched"] == 1
    assert body["cooperatives_created"] == 1
    assert len(client.get(f"/assessments/{existing['id']}").json()) == 3


# ---------------------------------------------------------------------------
# Causes
# ---------------------------------------------------------------------------

def test_cause_handling(client):
    text = (
        "cooperative_name,district,crop,season,harvested_qty_kg,total_loss_kg,dominant_cause,"
        "loss_storage_kg,loss_theft_kg\n"
        "Example Coop,Burera,Maize,A,1000,100,,,\n"          # total only → estimated
        "Example Coop,Burera,Maize,B,1000,100,theft,,\n"     # reported cause → not estimated
        "Example Coop,Huye,Maize,A,1000,90,theft,60,40\n"    # columns win; two warnings
    )
    rows = _upload(client, text).json()["rows"]
    assert rows[0]["dominant_cause"] == "processing" and rows[0]["dominant_cause_is_estimated"] is True
    assert rows[1]["dominant_cause"] == "theft" and rows[1]["dominant_cause_is_estimated"] is False
    assert rows[1]["recommendation"].startswith("Consider community or shared storage")
    assert rows[2]["dominant_cause"] == "storage" and rows[2]["total_loss_kg"] == 100
    assert len(rows[2]["warnings"]) == 2

    coop = next(c for c in client.get("/coops").json() if c["district"] == "Burera")
    saved = client.get(f"/assessments/{coop['id']}").json()
    assert [a["dominant_cause_is_estimated"] for a in saved] == [True, False]
    assert saved[0]["cause_breakdown_json"] is None


def test_assess_saves_estimated_flag_and_year(client):
    coop = client.post("/coop", json={"name": "Manual", "district": "Huye"}).json()
    client.post("/assess", json={"coop_id": coop["id"], "district": "Huye", "crop": "Maize",
                                 "season": "A", "harvested_qty_kg": 100, "total_loss_kg": 10, "year": 2025})
    saved = client.get(f"/assessments/{coop['id']}").json()[0]
    assert saved["dominant_cause_is_estimated"] is True
    assert saved["season_year"] == 2025
    assert saved["import_batch_id"] is None


# ---------------------------------------------------------------------------
# Rejections and limits
# ---------------------------------------------------------------------------

def test_sample_names_are_reserved(client, monkeypatch, fresh_db):
    monkeypatch.setenv("SEED_DEMO", "true")
    with TestClient(app) as c:
        text = HEADER + "\nSample Cooperative — Burera,Burera,Maize,A,2025,1000,100,,\n"
        body = _upload(c, text, dry_run=True).json()
        assert "reserved" in body["errors"][0]


def test_file_type_and_size_limits(client):
    assert _upload(client, FIVE_ROWS, filename="data.xlsx").status_code == 415
    assert "Save As" in _upload(client, FIVE_ROWS, filename="data.xlsx").json()["detail"]
    r = client.post("/datasets/import-assessments/file",
                    files={"file": ("data.pdf", b"%PDF", "application/pdf")})
    assert r.status_code == 415
    big = HEADER + "\n" + "Example Coop,Huye,Maize,A,2025,1000,100,," * 1 + "\n" + "x" * (2 * 1024 * 1024)
    assert _upload(client, big).status_code == 413
    many = HEADER + "\n" + "".join(f"Example Coop,Huye,Maize,A,2025,{1000 + i},100,,\n" for i in range(1001))
    assert _upload(client, many).status_code == 422
    assert _upload(client, "").status_code == 422


# ---------------------------------------------------------------------------
# Undo
# ---------------------------------------------------------------------------

def test_undo_import(client):
    existing = client.post("/coop", json={"name": "Example Coop One", "district": "Nyagatare"}).json()
    batch_id = _upload(client, FIVE_ROWS).json()["batch_id"]

    r = client.delete(f"/datasets/imports/{batch_id}")
    assert r.status_code == 200
    assert r.json() == {"batch_id": batch_id, "assessments_deleted": 5, "cooperatives_deleted": 1}
    assert [c["id"] for c in client.get("/coops").json()] == [existing["id"]]  # pre-existing coop kept
    assert client.get(f"/assessments/{existing['id']}").json() == []

    assert client.delete(f"/datasets/imports/{batch_id}").status_code == 404


def test_undo_keeps_coop_used_by_a_later_import(client):
    first = _upload(client, HEADER + "\nExample Coop,Huye,Maize,A,2024,1000,100,,\n").json()["batch_id"]
    _upload(client, HEADER + "\nExample Coop,Huye,Maize,A,2025,1000,100,,\n")
    body = client.delete(f"/datasets/imports/{first}").json()
    assert body["cooperatives_deleted"] == 0
    assert _coop_count(client) == 1
