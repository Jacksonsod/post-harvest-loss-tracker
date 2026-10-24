# Importing harvest records

Cooperatives can load several harvest records at once from a CSV file instead of
entering them one by one. Each record is scored exactly like `POST /assess`:
loss rate, benchmark (with its sample size and any volatility caution), risk
category, main cause, recommendation and estimated value lost.

## Steps

1. Download the template: `GET /datasets/import-template`.
2. Fill one row per harvest in Excel (or any spreadsheet) and save it as **CSV**.
3. Preview: `POST /datasets/import-assessments/file?dry_run=true` with the file.
   Nothing is saved; every row comes back with its result or its errors.
4. Import: the same request without `dry_run`. The response has a `batch_id`.
5. Made a mistake? `DELETE /datasets/imports/{batch_id}` undoes that import.

The frontend can send the same rows as JSON instead:
`POST /datasets/import-assessments` with `{"records": [{...}, ...]}`, using the
column names below as keys.

## Columns

| Column | Required | Type | Meaning |
|---|---|---|---|
| `cooperative_name` | yes | text | Cooperative name. Rows with the same name and district go to the same cooperative (case and extra spaces are ignored); a new name creates a new cooperative. |
| `district` | yes | text | One of Rwanda's 30 districts, spelled as in GET /options (case is ignored). |
| `crop` | yes | text | One of the 21 NISR crop categories, spelled as in GET /options (case is ignored). |
| `season` | no | A, B or C | Agricultural season. Leave empty if unknown (the district benchmark is used). |
| `year` | no | whole number | Harvest year, e.g. 2025. Used to show the cooperative's history in the right order. |
| `harvested_qty_kg` | yes | number | Total quantity harvested, in kg. Must be greater than 0. |
| `total_loss_kg` | no | number | Total quantity lost, in kg. Required unless you fill in the loss_..._kg columns. |
| `loss_theft_kg` | no | number | Kg lost to theft. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_insects_pests_kg` | no | number | Kg lost to insects and pests. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_birds_animals_kg` | no | number | Kg lost to birds and animals. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_stalks_fallen_kg` | no | number | Kg lost to stalks fallen before collection. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_harvesting_damage_kg` | no | number | Kg lost to damage during harvesting. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_transport_kg` | no | number | Kg lost to transport. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_storage_kg` | no | number | Kg lost to storage. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_processing_kg` | no | number | Kg lost to processing. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_packaging_kg` | no | number | Kg lost to packaging. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `loss_sale_kg` | no | number | Kg lost to the point of sale. Optional; when any of these columns are filled, their sum is used as the total loss. |
| `dominant_cause` | no | cause code | Main cause of loss when you only know the total: one of theft, insects_pests, birds_animals, stalks_fallen, harvesting_damage, transport, storage, processing, packaging, sale. Ignored when the loss_..._kg columns are filled. |
| `action_taken` | no | text | What the cooperative changed since its previous harvest (max 500 characters). |

## Rules

- Save the file as CSV (in Excel: File → Save As → CSV). Comma, semicolon and tab separators all work.
- Use a dot for decimals and no thousands separators: 1200.5, not 1,200.5.
- Give either total_loss_kg or the loss_..._kg columns for each row.
- Run a preview first (dry_run=true): nothing is saved and every row's result is shown.
- The import is all-or-nothing: if any row has an error, nothing is saved. Fix the rows listed and upload again.
- Rows already in the system (same cooperative, district, crop, season, year and quantities) are skipped, so uploading the same file twice does not create duplicates.
- Every import gets a batch_id. Undo it with DELETE /datasets/imports/{batch_id}.
- Cooperative names starting with 'Sample Cooperative' are reserved for the labelled demo data.
- At most 1000 rows and 2 MB per file.

## Responses

| Situation | HTTP | `status` |
|---|---|---|
| Preview (`dry_run=true`) | 200 | `preview` — errors listed, nothing saved |
| Any row invalid | 422 | `failed` — nothing saved; fix the rows in `errors` |
| Imported | 201 | `imported` — `batch_id` set |
| Every row already in the system | 200 | `imported` — `imported_count` 0 |
| Excel/other file type | 415 | — save as CSV |
| File over 2 MB | 413 | — split the file |
| Missing required columns, empty file, over 1000 rows | 422 | — |

Each entry in `rows` has the spreadsheet row number (`row`, header = row 1),
`status` (`ok`, `error` or `duplicate`), the computed results, and `errors` /
`warnings`. `errors` at the top level lists every problem as `Row N: ...`.

The full column reference is also available as JSON at `GET /datasets/import-format`
(the source of this table: `backend/import_service.py`).

## Example

```csv
cooperative_name,district,crop,season,year,harvested_qty_kg,total_loss_kg,loss_storage_kg,loss_theft_kg,dominant_cause,action_taken
Example Cooperative,Nyagatare,Maize,A,2024,1000,200,,,storage,
Example Cooperative,Nyagatare,Maize,A,2025,1000,,90,30,,Switched to hermetic bags
```

Row 2 gives only a total and names the main cause; row 3 gives a breakdown, so
its total (120 kg) and main cause (storage) are computed from the columns.

```bash
curl -o template.csv http://localhost:8000/datasets/import-template
curl -F file=@my_harvests.csv 'http://localhost:8000/datasets/import-assessments/file?dry_run=true'
curl -F file=@my_harvests.csv  http://localhost:8000/datasets/import-assessments/file
curl -X DELETE http://localhost:8000/datasets/imports/<batch_id>
```
