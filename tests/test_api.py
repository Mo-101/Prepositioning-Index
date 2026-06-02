from fastapi.testclient import TestClient

from deepcal.api import app


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "deepcal"}


def test_readiness_endpoint() -> None:
    client = TestClient(app)

    response = client.post(
        "/readiness",
        json={
            "inventory_coverage": 0.82,
            "route_reliability": 0.74,
            "facility_condition": 0.91,
            "demand_urgency": 0.65,
        },
    )

    assert response.status_code == 200
    assert response.json()["score"] == 0.784
    assert "explanation" in response.json()
