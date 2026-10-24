"""
Test setup: point the app at a throwaway SQLite file *before* db.py is
imported, and make the backend modules importable.
"""

import os
import sys
import tempfile

_TMP_DIR = tempfile.mkdtemp(prefix="phl-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMP_DIR, 'test.db')}"
os.environ.pop("SEED_DEMO", None)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from db import Base, engine, init_db  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture
def fresh_db():
    """Drop and recreate every table so a test starts from an empty database."""
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield


@pytest.fixture
def client(fresh_db):
    with TestClient(app) as c:
        yield c
