"""
predict_loss_risk.py

Purpose:
    Adds a predictive layer on top of the static benchmarks. Instead of only
    comparing a cooperative's reported loss to a historical average, this
    trains a simple regression model on SAS historical data to estimate an
    *expected* loss rate given crop, district, season, and (optionally)
    storage/transport conditions if that data is available.

    This turns the tool from "benchmark comparison" into "predictive risk
    tool" — the kind of innovation the evaluation criteria call out
    (predictive models / smart alerts).

Usage:
    python predict_loss_risk.py --input raw_sas_data.csv --output model.pkl

Design notes:
    - Kept intentionally simple (RandomForestRegressor) — a hackathon judge
      wants to see sound methodology and a working demo, not a
      state-of-the-art model. Simplicity you can explain > complexity you
      can't defend live.
    - Categorical features (district, crop, season) are one-hot encoded.
    - If you don't have storage-condition data, drop that feature — the
      model still works with crop + district + season alone, just less rich.
"""

import argparse
import json
import pickle

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


FEATURE_COLS = ["district", "crop", "season"]  # add "storage_type" if you have it
TARGET_COL = "loss_rate_pct"


def load_training_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df.dropna(subset=FEATURE_COLS + [TARGET_COL])


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURE_COLS),
        ]
    )
    model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def train_and_evaluate(df: pd.DataFrame):
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Validation MAE: {mae:.2f} percentage points "
          f"(on {len(X_test)} held-out records)")

    return pipeline, mae


def predict_for_scenario(pipeline: Pipeline, district: str, crop: str, season: str) -> float:
    """Convenience function your API endpoint can call at request time."""
    scenario = pd.DataFrame([{
        "district": district,
        "crop": crop,
        "season": season,
    }])
    return round(float(pipeline.predict(scenario)[0]), 2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to raw SAS CSV with a loss_rate_pct column")
    parser.add_argument("--output", default="model.pkl", help="Path to save the trained model")
    args = parser.parse_args()

    df = load_training_data(args.input)
    pipeline, mae = train_and_evaluate(df)

    with open(args.output, "wb") as f:
        pickle.dump(pipeline, f)

    # Example: sanity-check a prediction
    example = predict_for_scenario(pipeline, district="Nyagatare", crop="Maize", season="2025A")
    print(f"Example predicted loss rate (Nyagatare, Maize, 2025A): {example}%")
    print(f"Model saved to {args.output}")


if __name__ == "__main__":
    main()
