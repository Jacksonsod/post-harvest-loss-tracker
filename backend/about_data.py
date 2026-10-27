"""
about_data.py

Fixed methodology statements and data sources for GET /about-data.
The wording matches the "Methodology summary" section of docs/DATA.md —
change both together.
"""

from __future__ import annotations

from typing import Dict, List

METHODOLOGY: List[str] = [
    "Loss is the sum of the 10 itemized loss causes (s2q41–s2q50), because the "
    "total-loss question (s2q39) does not exist in the 2025 questionnaire.",
    "Selling-price codes 9999 (\"don't know\") and 0 (not sold) are treated as missing.",
    "Averages use the survey's plot weights, with any single plot's weight capped at "
    "25% of its group's total weight.",
    "A benchmark needs at least 5 usable plots; otherwise the next level up is used "
    "(district and season → district → national).",
    "Risk categories compare your loss rate with the benchmark: Low if at most 85% of "
    "it, High if above 115% of it, Medium in between.",
    "A benchmark is flagged as highly variable when at least 15% of its surveyed plots "
    "reported losing their whole harvest; it is shown with a caution, not hidden.",
    "A machine-learning model was tested (trained on 2024, tested on 2025) and rejected "
    "as too weak (AUC 0.59).",
    "2024 and 2025 are pooled; benchmarks vary by season (A, B, C), not by year.",
]

SOURCES: List[Dict[str, str]] = [
    {
        "name": "NISR Seasonal Agricultural Survey (SAS) 2024 — microdata",
        "url": "https://microdatabk.statistics.gov.rw",
        "note": "Catalog ID 113. Production files, Seasons A/B/C. Free account required.",
    },
    {
        "name": "NISR Seasonal Agricultural Survey (SAS) 2025 — microdata",
        "url": "https://microdatabk.statistics.gov.rw",
        "note": "Catalog ID 124. Production files, Seasons A/B/C. Free account required.",
    },
    {
        "name": "geoBoundaries — Rwanda district boundaries (ADM2)",
        "url": "https://www.geoboundaries.org",
        "note": "Map geometry only; no statistics.",
    },
    {
        "name": "Rwanda NST2 post-harvest loss target",
        "note": "Official baseline 13.8% (2023), target below 5% by 2029. "
                "Presented to Parliament, August 2025.",
    },
]
