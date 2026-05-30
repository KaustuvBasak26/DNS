import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    c = TestClient(app)
    c.delete("/api/cache")
    yield c
    c.delete("/api/cache")
