# Build Phases

Submission deadline: **30 Oct 2026, 23:59**

- [x] **Phase 1 — Data Pipeline** (done Sept 21)
  Cleaned & merged real 2024+2025 SAS Production files. Cause-sum loss logic,
  district typo fix, price sentinel fix (9999/0), weighted benchmarks by
  national/district/district+season, cause-of-loss breakdown, average
  selling price. Output: `data/processed/benchmarks.json`,
  `data/processed/cleaned_production.csv`.

- [x] **Phase 2 — Predictive Approach Decided** (done Sept 21)
  Tested a two-stage ML model with temporal validation (train 2024, test
  2025) — found too weak to trust (AUC 0.59, MAE 26.5pp). Switched to a
  **risk-category classification** (Low/Medium/High vs. benchmark) plus a
  **cause-of-loss-based recommendation engine**, which is defensible with
  the data actually available. See `docs/DATA.md` for the full reasoning.

- [x] **Phase 3 — Backend API** (done Sept 23)
  FastAPI service built with all 6 endpoints (`/health`, `/benchmark`,
  `POST /coop`, `GET /coops`, `POST /assess`, `GET /assessments/{coop_id}`),
  SQLite persistence, risk-category logic, cause-based recommendations, RWF
  economic translation. Verified against the full Postman collection
  (11/11 tests passing) after a code review caught and fixed 5 issues
  (stale README command, missing negative-loss guard, missing over-100%-loss
  validation, manual session handling, hardcoded benchmarks.json path) and
  a benchmark-weighting bug in the data pipeline (see `docs/DATA.md`).

- [ ] **Phase 4 — Frontend Dashboard** (target: Oct 10)
  Coop profile + harvest/loss entry forms; dashboard with risk category,
  benchmark comparison chart, cause-of-loss breakdown chart, recommendation
  card, RWF loss estimate.

- [ ] **Phase 5 — Integration + Deployment** (target: Oct 18)
  Connect frontend/backend end-to-end, deploy live (Vercel/Render/Railway).
  Registration deadline (Oct 20) already satisfied — no risk here.

- [ ] **Phase 6 — Polish, Docs, Demo Prep** (target: Oct 27)
  Finalize README/methodology docs, demo rehearsal, bug pass.

- [ ] **Phase 7 — Buffer & Submit** (Oct 28-30)
