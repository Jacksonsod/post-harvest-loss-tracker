"""
clean_sas_benchmarks.py

Purpose:
    Ingest raw NISR Seasonal Agricultural Survey (SAS) data, clean it,
    and compute post-harvest loss benchmarks per crop / district / season.
    Outputs a static JSON file that the frontend/app consumes directly —
    no live data pipeline needed for the hackathon demo.

Usage:
    python clean_sas_benchmarks.py --input raw_sas_data.csv --output benchmarks.json

Expected raw input columns (adjust to match actual SAS file structure once downloaded):
    district, season, crop, area_planted_ha, production_tonnes,
    quantity_lost_tonnes  (or a loss-rate column if SAS provides one directly)

If SAS doesn't publish loss rates directly, pair it with FAO / post-harvest
loss study estimates as your baseline loss-rate assumptions per crop, and
note that assumption clearly in your repo's README (judges will want to see
the methodology, not just the numbers).
"""

import argparse
import json
import pandas as pd


def load_raw_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    # Drop rows missing core fields
    required = ["district", "season", "crop", "production_tonnes"]
    df = df.dropna(subset=[c for c in required if c in df.columns])

    # Normalize text fields
    for col in ["district", "season", "crop"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.title()

    # Guard against negative or nonsensical values
    numeric_cols = [c for c in df.columns if "tonnes" in c or "ha" in c]
    for col in numeric_cols:
        df = df[df[col] >= 0]

    return df


def compute_loss_rate(df: pd.DataFrame) -> pd.DataFrame:
    """
    If quantity_lost_tonnes is present, compute loss rate directly.
    Otherwise, this is the spot to merge in external baseline loss-rate
    assumptions per crop (document the source in your README).
    """
    if "quantity_lost_tonnes" in df.columns:
        df["loss_rate_pct"] = (
            df["quantity_lost_tonnes"] / df["production_tonnes"].replace(0, pd.NA)
        ) * 100
    else:
        raise ValueError(
            "No quantity_lost_tonnes column found — merge in external "
            "loss-rate assumptions before proceeding. See docstring."
        )

    df["loss_rate_pct"] = df["loss_rate_pct"].round(2)
    return df


def build_benchmarks(df: pd.DataFrame) -> dict:
    """
    Aggregates to produce three benchmark levels the app can compare
    a cooperative's self-reported loss rate against:
      - national average per crop
      - district average per crop
      - district+season average per crop (most specific)
    """
    national = (
        df.groupby("crop")["loss_rate_pct"]
        .mean()
        .round(2)
        .to_dict()
    )

    district = (
        df.groupby(["district", "crop"])["loss_rate_pct"]
        .mean()
        .round(2)
        .reset_index()
    )
    district_lookup = {}
    for _, row in district.iterrows():
        district_lookup.setdefault(row["district"], {})[row["crop"]] = row["loss_rate_pct"]

    seasonal = (
        df.groupby(["district", "season", "crop"])["loss_rate_pct"]
        .mean()
        .round(2)
        .reset_index()
    )
    seasonal_lookup = {}
    for _, row in seasonal.iterrows():
        key = f'{row["district"]}|{row["season"]}'
        seasonal_lookup.setdefault(key, {})[row["crop"]] = row["loss_rate_pct"]

    return {
        "national_avg_loss_rate_pct": national,
        "district_avg_loss_rate_pct": district_lookup,
        "district_season_avg_loss_rate_pct": seasonal_lookup,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to raw SAS CSV")
    parser.add_argument("--output", default="benchmarks.json", help="Path to output JSON")
    args = parser.parse_args()

    df = load_raw_data(args.input)
    df = clean_data(df)
    df = compute_loss_rate(df)
    benchmarks = build_benchmarks(df)

    with open(args.output, "w") as f:
        json.dump(benchmarks, f, indent=2)

    print(f"Wrote benchmarks for {df['crop'].nunique()} crops "
          f"across {df['district'].nunique()} districts to {args.output}")


if __name__ == "__main__":
    main()
