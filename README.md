# Cooperative Post-Harvest Loss Tracker

Built for the **NISR 2026 Big Data Hackathon** — Track 1: Agricultural Productivity.

**Team:** BIMENYIMANA Jackson & MEEKNESS Bonheur

## What this is

A tool that helps agricultural cooperatives in Rwanda track and understand their
post-harvest losses, benchmark them against real national survey data, and get an
early prediction of expected loss risk for an upcoming season — broken down by cause
(theft, pests, birds, harvesting, transport, storage, processing, packaging, sale).

See [`docs/Cooperative_Post-Harvest_Loss_Tracker_Project_Description.pdf`](docs/Cooperative_Post-Harvest_Loss_Tracker_Project_Description.pdf)
for the full project description.

## Data source

Rwanda National Institute of Statistics (NISR), Seasonal Agricultural Survey (SAS)
2024 and 2025, raw microdata — Production files, Seasons A/B/C.
See [`docs/DATA.md`](docs/DATA.md) for exactly how to download it and how the
combined 2024+2025 loss metric is computed.

Raw data is **not committed to this repo** (large files, download separately).

## Repo structure

```
data/
  raw/          # NISR raw SAS files go here locally (gitignored)
  processed/    # cleaned/aggregated output (benchmarks.json etc.)
notebooks/      # data cleaning + model training scripts
backend/        # FastAPI service (benchmarks + prediction endpoint)
frontend/       # React dashboard
docs/           # project description, data notes, methodology
```

## Setup

```bash
# Python side (data cleaning + model)
cd notebooks
pip install -r requirements.txt
python clean_sas_benchmarks.py --input ../data/raw/<file>.csv --output ../data/processed/benchmarks.json
python predict_loss_risk.py --input ../data/raw/<file>.csv --output ../backend/model.pkl

# Backend
cd ../backend
pip install -r requirements.txt
uvicorn api_predict:app --reload --port 8000

# Frontend
cd ../frontend
npm install
npm run dev
```

## Status

See [`docs/PHASES.md`](docs/PHASES.md) for the current build phase and task breakdown.
