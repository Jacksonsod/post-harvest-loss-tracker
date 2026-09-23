# Data Notes

## Source

Rwanda National Institute of Statistics (NISR) — Seasonal Agricultural Survey (SAS),
raw microdata catalog: https://microdatabk.statistics.gov.rw

- SAS 2024 — catalog ID 113
- SAS 2025 — catalog ID 124

Download requires a free account at microdatabk.statistics.gov.rw. We use the
**Production** files for Seasons A, B, and C from both years.

Files are tab-separated despite the `.csv` extension — read with `sep='\t'`.

## Key columns

| Column | Meaning |
|---|---|
| `s1q2` | District |
| `s2q4` / `CropCategory` | Crop name / crop category (grouped) |
| `s2q22` | Total harvest quantity |
| `s2q37` | Storage facility type |
| `s2q41`–`s2q50` | Loss quantity by cause (theft, pests, birds, harvest damage, ground fall, transport, storage, processing, packaging, sale) |
| `plot_weight` | Survey sampling weight — use for nationally representative averages |

## Loss metric — important methodology note

The 2024 files include `s2q39` (respondent's self-reported total loss), but this
field **does not exist in the 2025 questionnaire** (the survey was restructured).
Additionally, in the 2024 data, `s2q39` does not always match the sum of the
individual cause columns (~20% of rows differ) — a normal survey artifact where a
respondent's recalled total doesn't perfectly reconcile with their itemized answers.

**Decision:** we define `total_loss` as the sum of the individual cause columns
(`s2q41` through `s2q50`) for both years. This is consistent across 2024 and 2025,
and it's what directly powers the cause-of-loss breakdown feature anyway.

## Known data quirks

- A small number of 2025 rows have `s1q2 == "Nyarugenege"`, a typo for `Nyarugenge`
  — normalize before grouping.
- Most crop-plot records report zero loss in a given season (~74% using the
  cause-sum method) — this is expected, not a data quality issue. Don't drop zero
  rows; they're needed for correct average loss-rate calculations.
- Sample sizes per district/crop combination vary a lot — some rare crops (fruits,
  other cereals) have too few nonzero-loss records for a reliable per-district
  benchmark. Fall back to `CropCategory`-level or national benchmarks for those,
  and say so plainly in the app rather than presenting a shaky number as precise.

- `s2q28` (selling price, RWF/kg) uses missing-value sentinels: `9999`
  ("don't know"/not applicable — ~38% of non-null entries) and `0` (crop
  wasn't sold). Both are excluded before computing price benchmarks;
  otherwise the average price comes out wildly inflated.

## Combined dataset size (2024 + 2025, Seasons A+B+C, cleaned)

- 134,766 total crop-plot records (after dropping rows with no harvest qty)
- 37,894 records with nonzero loss (28.1%, cause-sum method)

## Model approach — risk category, not a precise percentage

An initial attempt to train a two-stage model (loss-occurrence classifier +
severity regressor) directly on district/crop/season/storage-type features
was tested with temporal validation (train on 2024, test on 2025):

- Loss-occurrence classifier AUC: 0.588 (barely better than random)
- Loss-severity regressor MAE: 26.5 percentage points (too high to be useful,
  given most real loss rates fall in the 5-20% range)

**Decision:** these four categorical features don't carry enough signal for a
reliable precise percentage prediction, and a counterfactual "Action Engine"
built on top of a weak model produced a counterintuitive, untrustworthy
result. Rather than present a falsely precise number, the app instead:

1. Uses the real weighted benchmark data (`benchmarks.json`) to classify a
   cooperative's reported loss into a **Low / Medium / High risk** category
   relative to their district+crop+season benchmark.
2. Bases its recommendation (Action Engine) directly on the **cause-of-loss
   breakdown** for their crop (which cause dominates their losses), not on a
   simulated counterfactual from an unreliable model.

This is a more honest and defensible approach given what the data supports.
Richer features (fertilizer use, improved seed use, farm size) could improve
a future model version — noted as a stretch goal, not MVP.
