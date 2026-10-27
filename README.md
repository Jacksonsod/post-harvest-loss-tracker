# Rwanda Harvest Loss Tracker

**Post-harvest loss benchmarking and advice for Rwandan cooperatives, district planners and policymakers, built on NISR survey data.**

| | |
|---|---|
| **Live app** | https://harvestloss-rw.vercel.app |
| **API** | https://post-harvest-loss-tracker-production.up.railway.app (interactive docs at [`/docs`](https://post-harvest-loss-tracker-production.up.railway.app/docs)) |
| **Demo video** | [`demo/demo.webm`](demo/demo.webm) |
| **Login** | None needed. The app is fully public. |

Built for the **NISR 2026 Big Data Hackathon**, Track 1: Agricultural Productivity. |

**Team:** **ArcLab** |
**MEMBERS:**
BIMENYIMANA Jackson & MEEKNESS Bonheur

---

## The problem

A large share of Rwanda's harvest is lost after it is collected: to theft, pests, birds, damage during harvesting, poor storage, transport and processing. Under NST2, the Government of Rwanda aims to cut post-harvest losses from **13.8% (2023) to below 5% by 2029**.

Most cooperatives have no simple way to know whether their losses are normal, what causes them, or what to do first. Planners and policymakers lack a quick view of where losses are worst.

## What data the app uses

- **NISR Seasonal Agricultural Survey (SAS) 2024 and 2025.** We use the raw microdata Production files for Seasons A, B and C: **134,766 crop-plot records** across all **30 districts** and **21 crop categories**, of which 37,894 report a loss. We use each plot's reported harvest, its loss broken down into 10 causes, its storage type, the selling price and the survey weight.
- **geoBoundaries:** Rwanda district (ADM2) boundaries, used for the district map.
- **NST2 post-harvest loss target:** 13.8% in 2023, below 5% by 2029. Shown for context next to the survey figures, never mixed with them.

## What the app communicates

1. **How much is lost, and where.** The national average loss rate is **10.22%**, about 10 kg lost of every 100 kg harvested. The app also shows how this varies by district, crop and season.
2. **Whether one cooperative's loss is normal.** A loss is compared with the real survey average for the same district, crop and season, and classed as Low, Medium or High risk.
3. **Why losses happen and what to do.** The app names the main cause of loss and gives a practical recommendation for it.
4. **What the loss is worth.** Lost kilograms are converted to Rwandan francs using real average selling prices.
5. **Where to act first.** It lists the highest-risk districts and crops, unusual cases and suggested interventions for planners. It also shows progress against the NST2 target for policymakers.

## How users interact with it

| Page | Who it's for | What you do there |
|---|---|---|
| **National picture** | Planners, policymakers | Filter the district map by season and crop. See the highest-loss districts, vulnerable crops, suggested interventions and the NST2 comparison. |
| **Check my losses** | Cooperatives | Enter a harvest and its losses, either by cause or as a single total. Get the risk level, main cause, recommendation and value lost. Export a short field-ready summary. |
| **Plan next season** | Cooperatives | Enter an expected harvest to see the expected loss in kg and RWF, and compare loss rates by storage type. |
| **Cooperative progress** | Cooperatives | See a cooperative's past assessments and its loss trend over time. |
| **Explore the data** | Everyone | Browse the benchmarks by district, crop and season. |
| **About the data** | Everyone | Sources, record counts, methodology, and bulk import of harvest records from CSV. |

Three clearly labelled **sample cooperatives** ("Sample Cooperative — …") are pre-loaded so the app can be explored straight away. They are fictional, but their results are computed from the real benchmarks.

## Methodology (summary)

Full details are in [`docs/DATA.md`](docs/DATA.md).

- **Loss** = the sum of the 10 itemised loss causes. The survey's "total loss" question does not exist in the 2025 questionnaire, so this is the only measure that works for both years.
- **Prices:** the survey codes `9999` (don't know) and `0` (not sold) are treated as missing.
- **Averages** use the survey's sampling weights. Any single plot's weight is capped at 25% of its group, so a few heavily weighted responses can't dominate.
- **Benchmarks** need at least 5 usable plots. Otherwise the app falls back from district+season to district, then to national, and always shows how many plots a figure is based on.
- **Unusually variable seasons** (15% or more of surveyed plots lost their whole harvest) are flagged with a caution rather than hidden.
- **Risk:** Low if at or below 85% of the benchmark, High if above 115%, Medium in between.
- **Why no machine-learning prediction:** we trained a two-stage model on 2024 and tested it on unseen 2025 data. It was too weak to trust (AUC 0.59; average error 26.5 percentage points), so the app uses transparent benchmark comparisons instead of a falsely precise prediction. The validation script is included.

## Highlights

- **Problem & relevance:** targets the NST2 post-harvest loss goal directly.
- **Data use & methodology:**
  - NISR SAS 2024+2025 combined with geoBoundaries and the NST2 target.
  - Weighted, sample-size-aware benchmarks.
  - Honest out-of-time validation (train on 2024, test on 2025).
- **Tech innovation:**
  - Benchmark-relative risk scoring and a cause-based recommendation engine.
  - Outlier alerts, intervention triggers and a pre-season estimator.
  - SMS-ready summaries and CSV bulk import.
- **Usability & design:** pages are organised around user questions, numbers are explained in plain language, risk is always shown with words as well as colours, and the layout works on mobile.
- **Tangible impact:** serves cooperatives, district planners and policymakers, and translates losses into RWF.

## Repository contents

```
backend/      FastAPI API (Python): scoring, benchmarks, overview endpoints, CSV import, tests
frontend/     React + Vite web app
notebooks/    Data pipeline (clean_sas_benchmarks.py) and ML validation (predict_loss_risk.py)
data/processed/
  benchmarks.json          Aggregated benchmarks used by the API (116 KB)
  cleaned_production.csv   Cleaned survey records, 134,766 rows (14 MB)
data/raw/     Raw NISR files go here locally (not committed)
docs/         DATA.md (methodology), IMPORT_FORMAT.md (CSV import), project description
demo/         Demo video
```

## Data files and links

- **Included:** `data/processed/benchmarks.json` and `data/processed/cleaned_production.csv`.
- **Not included:** the raw NISR microdata, because it's large and access requires a free NISR account. Download it from the NISR Microdata Portal: https://microdata.statistics.gov.rw/index.php/catalog
  - SAS 2024: https://microdata.statistics.gov.rw/index.php/catalog/113
  - SAS 2025: https://microdata.statistics.gov.rw/index.php/catalog/124

  Use the `*_Production.csv` files for Seasons A, B and C. They're tab-separated despite the `.csv` extension.

## Run it on your machine

Requirements: Python 3.10+ and Node.js 18+.

**1. Backend (API)**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
SEED_DEMO=true uvicorn main:app --reload --port 8000
```

On Windows PowerShell, set the variable first with `$env:SEED_DEMO="true"`.

Open http://localhost:8000/docs to try the API. To run the tests:

```bash
pip install -r requirements-dev.txt
pytest
```

**2. Frontend (in a second terminal)**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. It connects to `http://localhost:8000` by default. To use another API, set `VITE_API_URL` before building.

**3. Data pipeline (optional)**

Rebuild `benchmarks.json` from the included cleaned data, with no raw files needed:

```bash
cd notebooks
pip install -r requirements.txt
python clean_sas_benchmarks.py --from-cleaned ../data/processed/cleaned_production.csv --output-dir ../data/processed
```

Or rebuild everything from the raw NISR files placed under `data/raw/`:

```bash
python clean_sas_benchmarks.py --data-dir ../data/raw --output-dir ../data/processed
```

Reproduce the ML validation that led us not to use a prediction model:

```bash
python predict_loss_risk.py --input ../data/processed/cleaned_production.csv --output model_bundle.pkl
```

## Known limitations

- The 2024 and 2025 survey years are pooled. Benchmarks vary by season (A/B/C), not by year.
- Sample cooperatives are fictional and labelled as such. Their results use the real benchmarks.
- The survey-derived national rate (10.22%) is our own calculation, not an official statistic. It's shown separately from the official NST2 figures.
- The hosted database is SQLite. Data entered on the live app is kept, but the app is a prototype, not a production system.

## Declaration

We, **BIMENYIMANA Jackson** and **MEEKNESS Bonheur**, declare that this submission is our own original work. It has not been submitted to any other competition or entity, and all sources of reference are acknowledged in full below.


## Acknowledgements and sources

**Data**
- National Institute of Statistics of Rwanda (NISR). *Seasonal Agricultural Survey 2024* and *Seasonal Agricultural Survey 2025*, public-use microdata. NISR Microdata Portal, https://microdata.statistics.gov.rw
- Runfola D, Anderson A, Baier H, et al. (2020). *geoBoundaries: A global database of political administrative boundaries.* PLoS ONE 15(4): e0231866. https://doi.org/10.1371/journal.pone.0231866. Rwanda ADM2 boundaries, used under their open licence with attribution.
- Government of Rwanda, NST2 post-harvest loss target (13.8% in 2023 to below 5% by 2029), reported in *"Rwanda: Govt Targets to Cut Post-Harvest Losses to 5 Percent in Five Years"*, The New Times via AllAfrica, August 2025. https://allafrica.com/stories/202508130166.html

**Software**
- Backend: FastAPI, Uvicorn, SQLAlchemy, python-multipart
- Data pipeline: pandas, NumPy, scikit-learn
- Frontend: React, Vite, Tailwind CSS, Recharts, lucide-react, clsx, tailwind-merge
- Fonts: Inter and JetBrains Mono (Google Fonts)
- Hosting: Vercel (frontend), Railway (API)
