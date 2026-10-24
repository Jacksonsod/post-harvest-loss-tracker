"""
clean_sas_benchmarks.py

Cleans and combines the real NISR Seasonal Agricultural Survey (SAS) 2024 and
2025 Production files (Seasons A/B/C) into:
  1. data/processed/cleaned_production.csv — row-level cleaned data, used to
     train the predictive model (predict_loss_risk.py)
  2. data/processed/benchmarks.json — aggregated loss-rate benchmarks by
     national / district / district+season, plus average selling price, used
     to power the app's comparison dashboard

Key methodology decisions (see docs/DATA.md for the full reasoning):
  - `total_loss` is computed as the sum of individual loss-cause columns
    (s2q41-s2q50), NOT the s2q39 "total loss" field. s2q39 does not exist at
    all in the 2025 questionnaire, so the cause-sum is the only loss measure
    consistent across both years. This also directly powers the
    cause-of-loss breakdown and recommendation engine.
  - District and crop names come pre-decoded as text in the raw files (not
    numeric codes), but contain a few known typos/junk values that we clean.
  - National/district benchmarks are weighted by `plot_weight` (the survey's
    sampling weight) rather than a plain average, since a plain average
    would over/under-represent districts based on how many plots were
    sampled there rather than their true share of production.

Usage:
    python clean_sas_benchmarks.py --data-dir ../data/raw --output-dir ../data/processed
"""

import argparse
import glob
import json
import os

import pandas as pd
import numpy as np

CAUSE_COLS = ["s2q41", "s2q42", "s2q43", "s2q44", "s2q45",
              "s2q46", "s2q47", "s2q48", "s2q49", "s2q50"]

CAUSE_LABELS = {
    "s2q41": "theft",
    "s2q42": "insects_pests",
    "s2q43": "birds_animals",
    "s2q44": "stalks_fallen",
    "s2q45": "harvesting_damage",
    "s2q46": "transport",
    "s2q47": "storage",
    "s2q48": "processing",
    "s2q49": "packaging",
    "s2q50": "sale",
}

DISTRICT_FIXES = {
    "Nyarugenege": "Nyarugenge",  # known typo found in 2025 Season A data
}

KNOWN_STORAGE_CATEGORIES = {
    "Own storage",
    "Storage owned by Cooperatives/private companies",
    "Public storage",
    "Other storage(specify)",
}


def find_production_files(data_dir: str) -> list:
    """
    Expects a folder layout like:
        data/raw/2024/Season A/Rwa_raw_SeasonA2024_Production.csv
        data/raw/2025/Season B/Rwa_raw_SeasonB2025_Production.csv
    but will also work with any nested layout as long as filenames contain
    'Production' and a 4-digit year.
    """
    pattern = os.path.join(data_dir, "**", "*Production*.csv")
    return sorted(glob.glob(pattern, recursive=True))


def load_one_file(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="\t", low_memory=False)

    # Infer year and season from the filename, e.g. Rwa_raw_SeasonA2025_Production.csv
    fname = os.path.basename(path)
    year = next((y for y in ["2024", "2025", "2026"] if y in fname), "unknown")
    season = next((s for s in ["SeasonA", "SeasonB", "SeasonC"] if s in fname), "unknown")

    df["survey_year"] = int(year) if year != "unknown" else np.nan
    df["season"] = season.replace("Season", "") if season != "unknown" else "unknown"
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    # Normalize district names: strip whitespace, fix known typos
    df["s1q2"] = df["s1q2"].astype(str).str.strip()
    df["s1q2"] = df["s1q2"].replace(DISTRICT_FIXES)

    # Normalize crop category
    df["CropCategory"] = df["CropCategory"].astype(str).str.strip()

    # Storage type: some rows contain leftover numeric codes instead of the
    # decoded label (a small data-entry artifact) — treat those as Unknown
    # rather than a fabricated guess.
    df["storage_type_clean"] = df["s2q37"].where(
        df["s2q37"].isin(KNOWN_STORAGE_CATEGORIES), other=np.nan
    )

    # Ensure numeric columns are numeric (coerce junk to NaN)
    numeric_cols = CAUSE_COLS + ["s2q21", "s2q28", "plot_weight"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # s2q28 (selling price) uses missing-value sentinels: 9999 ("don't know" /
    # not applicable, ~38% of non-null entries) and 0 (crop wasn't sold, not
    # a real price of zero). Both would badly distort a price average if left
    # in — treat both as missing for pricing purposes.
    df["s2q28"] = df["s2q28"].replace({9999: np.nan, 0: np.nan})

    # Total loss = sum of cause columns (see module docstring for why)
    df["total_loss_kg"] = df[CAUSE_COLS].sum(axis=1, skipna=True)

    # Drop rows with no harvest quantity — can't compute a loss rate without it
    df = df[df["s2q21"].notna() & (df["s2q21"] > 0)].copy()

    df["loss_rate_pct"] = (df["total_loss_kg"] / df["s2q21"] * 100).round(2)
    # Cap at 100% — a small number of rows report loss > harvest, likely a
    # data entry or unit-mismatch issue; treat as a data quality ceiling
    # rather than silently allowing >100% "loss".
    df["loss_rate_pct"] = df["loss_rate_pct"].clip(upper=100)

    return df


def weighted_avg(df: pd.DataFrame, value_col: str, weight_col: str = "plot_weight",
                  max_weight_share: float = 0.25) -> tuple:
    """
    Returns (value, n_used) — n_used is the count of rows actually usable
    after dropping missing weight/value, which may be less than len(df) if
    some rows have NaN weight. Callers must gate their minimum-sample-size
    check on n_used, not len(df).

    Caps any single row's weight at `max_weight_share` of the group's total
    weight (default 25%). Without this, a small number of highly-weighted
    survey responses can dominate an otherwise reasonably-sized sample —
    e.g. a district/crop/season group with n=29 was found to have its
    average pulled to 93.98% by just 3 high-weight rows reporting 100%
    loss, even though most of the other 26 rows reported under 15% loss.
    This is a standard "weight capping" technique used to limit the
    influence of individually over-weighted survey responses.
    """
    d = df.dropna(subset=[value_col, weight_col]).copy()
    if len(d) == 0 or d[weight_col].sum() <= 0:
        return None, 0
    total_weight = d[weight_col].sum()
    cap = max_weight_share * total_weight
    d[weight_col] = d[weight_col].clip(upper=cap)
    capped_total = d[weight_col].sum()
    return round(float((d[value_col] * d[weight_col]).sum() / capped_total), 2), len(d)


def build_benchmarks(df: pd.DataFrame) -> dict:
    national = {}
    district = {}
    district_season = {}
    avg_price = {}
    cause_breakdown = {}

    MIN_SAMPLE = 5  # minimum usable (non-missing-weight) records for a benchmark claim

    for crop, g in df.groupby("CropCategory"):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None:
            national[crop] = val

        price, n_price = weighted_avg(g, "s2q28")
        if price is not None:
            avg_price[crop] = price

        # cause-of-loss proportions (share of total_loss attributable to each cause)
        totals = g[CAUSE_COLS].sum()
        total_all = totals.sum()
        if total_all > 0:
            cause_breakdown[crop] = {
                CAUSE_LABELS[c]: round(float(totals[c] / total_all * 100), 1)
                for c in CAUSE_COLS
            }

    for (dist, crop), g in df.groupby(["s1q2", "CropCategory"]):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None and n >= MIN_SAMPLE:  # gate on usable (non-missing-weight) records
            district.setdefault(dist, {})[crop] = val

    for (dist, season, crop), g in df.groupby(["s1q2", "season", "CropCategory"]):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None and n >= MIN_SAMPLE:
            key = f"{dist}|{season}"
            district_season.setdefault(key, {})[crop] = val

    # --- Overall national loss rate (single blended figure, all crops combined) ---
    overall_val, overall_n = weighted_avg(df, "loss_rate_pct")

    # --- Loss rate by storage type, per crop (for a real, data-driven storage comparison) ---
    storage_comparison = {}
    for (crop, storage), g in df.dropna(subset=["storage_type_clean"]).groupby(["CropCategory", "storage_type_clean"]):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None and n >= MIN_SAMPLE:
            storage_comparison.setdefault(crop, {})[storage] = {"avg_loss_rate_pct": val, "n_records": n}

    return {
        "national_avg_loss_rate_pct": national,
        "overall_national_avg_loss_rate_pct": overall_val,
        "district_avg_loss_rate_pct": district,
        "district_season_avg_loss_rate_pct": district_season,
        "avg_loss_rate_by_storage_type_pct": storage_comparison,
        "national_avg_selling_price_rwf_per_kg": avg_price,
        "national_cause_of_loss_breakdown_pct": cause_breakdown,
        "note": "District-level figures require at least 5 records with a usable "
                "sampling weight (not just 5 raw rows — rows with missing weight "
                "are excluded before this count). Any single row's weight is also "
                "capped at 25% of its group's total weight, to prevent a small "
                "number of highly-weighted survey responses from dominating an "
                "otherwise reasonably-sized sample. Thinner combinations fall back "
                "to the national or CropCategory average.",
    }


def build_extended_metrics(df: pd.DataFrame) -> dict:
    """
    Extra aggregates used by the redesigned UI, so the frontend never has to
    hardcode national figures. Everything here is derived from the same
    cleaned rows and the same weighted_avg() (weight-capped) as the core
    benchmarks, so numbers are consistent across every screen.
    """
    MIN_SAMPLE = 5

    def nested_counts(keys):
        out = {}
        for k, g in df.groupby(keys):
            val, n = weighted_avg(g, "loss_rate_pct")
            if val is None or n < MIN_SAMPLE:
                continue
            if len(keys) == 1:
                out[k if not isinstance(k, tuple) else k[0]] = n
            elif len(keys) == 2:
                out.setdefault(k[0], {})[k[1]] = n
            else:
                out.setdefault(f"{k[0]}|{k[1]}", {})[k[2]] = n
        return out

    # Sample sizes, parallel to the existing benchmark dicts (same gating)
    national_n = {crop: weighted_avg(g, "loss_rate_pct")[1] for crop, g in df.groupby("CropCategory")}
    district_n = nested_counts(["s1q2", "CropCategory"])
    district_season_n = nested_counts(["s1q2", "season", "CropCategory"])

    # All-crop district figures (for the national choropleth)
    district_overall = {}
    for dist, g in df.groupby("s1q2"):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None and n >= MIN_SAMPLE:
            district_overall[dist] = {"avg_loss_rate_pct": val, "n_records": n}

    district_season_overall = {}
    for (dist, season), g in df.groupby(["s1q2", "season"]):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None and n >= MIN_SAMPLE:
            district_season_overall[f"{dist}|{season}"] = {"avg_loss_rate_pct": val, "n_records": n}

    season_overall = {}
    for season, g in df.groupby("season"):
        val, n = weighted_avg(g, "loss_rate_pct")
        if val is not None:
            season_overall[season] = {"avg_loss_rate_pct": val, "n_records": n}

    # All-crop cause shares (unweighted kg shares, same method as the per-crop breakdown)
    totals = df[CAUSE_COLS].sum()
    total_all = float(totals.sum())
    cause_all = {CAUSE_LABELS[c]: round(float(totals[c] / total_all * 100), 1) for c in CAUSE_COLS} if total_all > 0 else {}

    # Volatility flag: district|season|crop groups where >=15% of usable plots
    # reported total (100%) loss. These are real but extreme seasons (see
    # docs/DATA.md, Kayonza paddy rice) and should be shown with a caution.
    volatility = {}
    for (dist, season, crop), g in df.groupby(["s1q2", "season", "CropCategory"]):
        d = g.dropna(subset=["loss_rate_pct", "plot_weight"])
        if len(d) < MIN_SAMPLE:
            continue
        share_total = float((d["loss_rate_pct"] >= 100).mean())
        if share_total >= 0.15:
            volatility.setdefault(f"{dist}|{season}", {})[crop] = {
                "share_plots_total_loss_pct": round(share_total * 100, 1),
                "n_records": int(len(d)),
            }

    n_total = int(len(df))
    n_nonzero = int((df["total_loss_kg"] > 0).sum())
    metadata = {
        "source": "NISR Seasonal Agricultural Survey (SAS) 2024 and 2025, Production files, Seasons A/B/C",
        "survey_years": sorted(int(y) for y in df["survey_year"].dropna().unique()),
        "n_records": n_total,
        "n_records_with_loss": n_nonzero,
        "share_records_with_loss_pct": round(n_nonzero / n_total * 100, 1) if n_total else None,
        "n_districts": int(df["s1q2"].nunique()),
        "n_crop_categories": int(df["CropCategory"].nunique()),
        "years_note": "2024 and 2025 are pooled. Benchmarks vary by season (A/B/C), not by year.",
    }

    return {
        "national_n_records": national_n,
        "district_n_records": district_n,
        "district_season_n_records": district_season_n,
        "district_overall_avg_loss_rate_pct": district_overall,
        "district_season_overall_avg_loss_rate_pct": district_season_overall,
        "season_overall_avg_loss_rate_pct": season_overall,
        "national_cause_of_loss_breakdown_all_crops_pct": cause_all,
        "high_volatility_benchmarks": volatility,
        "metadata": metadata,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-cleaned", default=None,
                         help="Rebuild benchmarks.json from an existing cleaned_production.csv "
                              "(no raw NISR files needed)")
    parser.add_argument("--data-dir", default=None,
                         help="Root folder containing raw SAS Production CSVs (searched recursively)")
    parser.add_argument("--output-dir", default=".", help="Folder to write outputs to")
    args = parser.parse_args()

    if args.from_cleaned:
        combined = pd.read_csv(args.from_cleaned)
        benchmarks = build_benchmarks(combined)
        benchmarks.update(build_extended_metrics(combined))
        os.makedirs(args.output_dir, exist_ok=True)
        out = os.path.join(args.output_dir, "benchmarks.json")
        with open(out, "w") as f:
            json.dump(benchmarks, f, indent=2)
        print(f"Rebuilt {out} from {args.from_cleaned} ({len(combined)} rows)")
        return
    if not args.data_dir:
        raise SystemExit("Provide --data-dir (raw NISR files) or --from-cleaned (cleaned_production.csv)")

    files = find_production_files(args.data_dir)
    if not files:
        raise SystemExit(f"No *Production*.csv files found under {args.data_dir}")

    print(f"Found {len(files)} Production files:")
    for f in files:
        print(" -", f)

    dfs = [load_one_file(f) for f in files]
    combined = pd.concat(dfs, ignore_index=True)
    combined = clean(combined)

    os.makedirs(args.output_dir, exist_ok=True)

    cleaned_path = os.path.join(args.output_dir, "cleaned_production.csv")
    keep_cols = ["survey_year", "season", "s1q2", "s2q4", "CropCategory",
                 "s2q21", "s2q28", "storage_type_clean", "plot_weight",
                 "total_loss_kg", "loss_rate_pct"] + CAUSE_COLS
    combined[keep_cols].to_csv(cleaned_path, index=False)
    print(f"\nWrote cleaned row-level data ({len(combined)} rows) to {cleaned_path}")

    benchmarks = build_benchmarks(combined)
    benchmarks.update(build_extended_metrics(combined))
    benchmarks_path = os.path.join(args.output_dir, "benchmarks.json")
    with open(benchmarks_path, "w") as f:
        json.dump(benchmarks, f, indent=2)
    print(f"Wrote benchmarks to {benchmarks_path}")

    nonzero = (combined["total_loss_kg"] > 0).sum()
    print(f"\nSummary: {len(combined)} total records, "
          f"{nonzero} ({nonzero/len(combined)*100:.1f}%) with nonzero reported loss")


if __name__ == "__main__":
    main()
