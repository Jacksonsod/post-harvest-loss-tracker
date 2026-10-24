"""
seed_demo.py

Creates a few clearly labelled sample cooperatives (is_sample = True) so the
live demo has something to show. Their assessments are created through the
same create_assessment() used by POST /assess, so every number shown for
them is computed from the real benchmarks — nothing is hand-written.

Runs on startup only when SEED_DEMO=true, and only when the cooperatives
table is empty, so restarting the server never duplicates them.

Standalone:  python seed_demo.py
"""

from __future__ import annotations

from db import Cooperative, get_session, init_db
from models import AssessRequest

# (cooperative name, district, [assessment inputs in chronological order])
_SAMPLES = [
    (
        "Sample Cooperative — Bugesera",
        "Bugesera",
        [
            # Low risk: 10% vs Bugesera/A/Maize benchmark
            dict(crop="Maize", season="A", harvested_qty_kg=2000,
                 loss_by_cause_kg={"insects_pests": 120, "theft": 60, "transport": 20}),
        ],
    ),
    (
        "Sample Cooperative — Burera",
        "Burera",
        [
            # High risk: 10% vs Burera/A/Maize benchmark, storage dominant
            dict(crop="Maize", season="A", harvested_qty_kg=1500,
                 loss_by_cause_kg={"storage": 90, "insects_pests": 45, "theft": 15}),
            # Follow-up season showing progress after acting on the recommendation
            dict(crop="Maize", season="B", harvested_qty_kg=1500,
                 loss_by_cause_kg={"storage": 40, "insects_pests": 30, "theft": 10},
                 previous_assessment_action_taken="Switched to hermetic storage bags"),
        ],
    ),
    (
        "Sample Cooperative — Nyagatare",
        "Nyagatare",
        [
            # Total-only entry: dominant cause is estimated from the national breakdown
            dict(crop="Maize", season="A", harvested_qty_kg=1000, total_loss_kg=180),
        ],
    ),
]


def seed_if_empty() -> int:
    """
    Create the sample cooperatives and their assessments if no cooperative
    exists yet. Returns the number of cooperatives created (0 if skipped).
    """
    # Imported here: main imports this module from its startup hook.
    from main import create_assessment

    db = get_session()
    try:
        if db.query(Cooperative).first() is not None:
            return 0
        for name, district, assessments in _SAMPLES:
            coop = Cooperative(name=name, district=district, is_sample=True)
            db.add(coop)
            db.commit()
            db.refresh(coop)
            for inputs in assessments:
                create_assessment(AssessRequest(coop_id=coop.id, district=district, **inputs), db)
        return len(_SAMPLES)
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    created = seed_if_empty()
    print(f"Created {created} sample cooperatives." if created else "Cooperatives already exist; nothing seeded.")
