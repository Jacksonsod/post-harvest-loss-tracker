"""
db.py

SQLite database setup using SQLAlchemy (ORM-lite style with Core).
Creates backend/app.db with two tables: cooperatives and assessments.
"""

import os
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship

# ---------------------------------------------------------------------------
# Engine — file lives at backend/app.db (gitignored)
# ---------------------------------------------------------------------------
_DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(_DB_DIR, 'app.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# ORM models
# ---------------------------------------------------------------------------

class Cooperative(Base):
    __tablename__ = "cooperatives"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    assessments = relationship("Assessment", back_populates="cooperative")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coop_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False)
    district = Column(String)
    crop = Column(String)
    season = Column(String)
    harvested_qty_kg = Column(Float)
    total_loss_kg = Column(Float)
    loss_rate_pct = Column(Float)
    benchmark_used_pct = Column(Float)
    benchmark_source = Column(String)   # "district_season" | "district" | "national"
    risk_category = Column(String)       # "Low" | "Medium" | "High"
    dominant_cause = Column(String, nullable=True)
    recommendation_text = Column(Text)
    estimated_loss_value_rwf = Column(Float, nullable=True)
    cause_breakdown_json = Column(Text)  # JSON-encoded dict of input cause breakdown
    action_notes = Column(Text, nullable=True)  # free-text: what changed since last assessment
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cooperative = relationship("Cooperative", back_populates="assessments")


# ---------------------------------------------------------------------------
# Schema migration helper (additive-only, safe to call on every startup)
# ---------------------------------------------------------------------------

def _migrate_columns() -> None:
    """
    Inspect the live assessments table and ADD any ORM-declared columns that
    do not yet exist (e.g. action_notes added in a later phase).
    Uses raw SQLite PRAGMA so it works without alembic or other migration tools.
    Silently skips columns that are already present.
    """
    import sqlite3 as _sqlite3

    db_path = str(engine.url).replace("sqlite:///", "")
    try:
        conn = _sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(assessments)")
        existing = {row[1] for row in cur.fetchall()}

        # Map ORM column name -> SQLite type for each new nullable column
        new_columns: dict = {
            "action_notes": "TEXT",
        }
        for col_name, col_type in new_columns.items():
            if col_name not in existing:
                cur.execute(f"ALTER TABLE assessments ADD COLUMN {col_name} {col_type}")
                conn.commit()
        conn.close()
    except Exception:
        # Non-fatal: server still starts; bad queries will surface the real error.
        pass


# ---------------------------------------------------------------------------
# Create tables on startup
# ---------------------------------------------------------------------------

def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    # Lightweight column migrations: add any new nullable columns to an existing
    # app.db without dropping it (SQLite does not support ALTER TABLE DROP COLUMN
    # in older versions, but ADD COLUMN is always safe).
    _migrate_columns()


def get_session() -> Session:
    """Return a new SQLAlchemy Session. Caller is responsible for closing it."""
    return Session(engine)


def get_db():
    """
    FastAPI dependency that yields a SQLAlchemy Session, rolls back on
    exception, and always closes the session when the request is done.
    """
    session = Session(engine)
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
