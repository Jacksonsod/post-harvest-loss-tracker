"""
api_predict.py

Purpose:
    Tiny FastAPI service that loads the trained model (model.pkl) and
    exposes a single endpoint the React frontend calls to get a predicted
    loss-risk percentage for a given district/crop/season combination.

    This is the piece that turns "we trained a model" into "the app
    actually uses it live" — which is what judges will click through
    during the demo.

Run:
    uvicorn api_predict:app --reload --port 8000

Then from the frontend:
    fetch("http://localhost:8000/predict?district=Nyagatare&crop=Maize&season=2025A")
"""

import pickle
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Post-Harvest Loss Risk API")

# Allow the frontend (running on a different port/domain) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before final deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("model.pkl", "rb") as f:
    pipeline = pickle.load(f)


@app.get("/predict")
def predict(
    district: str = Query(...),
    crop: str = Query(...),
    season: str = Query(...),
):
    scenario = pd.DataFrame([{"district": district, "crop": crop, "season": season}])
    predicted_loss_rate = round(float(pipeline.predict(scenario)[0]), 2)

    return {
        "district": district,
        "crop": crop,
        "season": season,
        "predicted_loss_rate_pct": predicted_loss_rate,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
