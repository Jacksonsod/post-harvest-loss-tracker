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

## Combined dataset size (2024 + 2025, Seasons A+B+C)

- ~146,000 total crop-plot records
- ~37,900 records with nonzero loss (cause-sum method)
