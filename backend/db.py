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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cooperative = relationship("Cooperative", back_populates="assessments")


# ---------------------------------------------------------------------------
# Create tables on startup
# ---------------------------------------------------------------------------

def init_db() -> None:
    Base.metadata.create_all(bind=engine)


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
