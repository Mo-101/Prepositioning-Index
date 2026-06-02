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


def test_grey_rank_endpoint() -> None:
    client = TestClient(app)

    response = client.post(
        "/grey/rank",
        json={
            "alternatives": ["weak", "strong"],
            "criteria": ["coverage", "cost"],
            "matrix": [[0.2, 100.0], [0.9, 50.0]],
            "criterion_types": {"coverage": "benefit", "cost": "cost"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ranking"] == ["strong", "weak"]
    assert body["normalized_matrix"] == [[0.0, 0.0], [1.0, 1.0]]
    assert body["grey_relational_grades"] == {"weak": 0.333333, "strong": 1.0}


def test_decision_rank_endpoint() -> None:
    client = TestClient(app)

    response = client.post(
        "/decision/rank",
        json={
            "alternatives": ["forward-hub", "mobile-cache"],
            "criteria": ["stock", "cost"],
            "criteria_weights": {"stock": 0.7, "cost": 0.3},
            "criterion_types": {"stock": "benefit", "cost": "cost"},
            "uncertainty_triples": [
                [
                    {"truth": 0.9, "indeterminacy": 0.1, "falsity": 0.1},
                    {"truth": 0.3, "indeterminacy": 0.2, "falsity": 0.6},
                ],
                [
                    {"truth": 0.5, "indeterminacy": 0.3, "falsity": 0.3},
                    {"truth": 0.9, "indeterminacy": 0.1, "falsity": 0.1},
                ],
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ranking"] == ["forward-hub", "mobile-cache"]
    assert body["grey_relational_grades"] == {"forward-hub": 1.0, "mobile-cache": 0.333333}
    assert body["topsis_closeness"] == {"forward-hub": 1.0, "mobile-cache": 0.0}
    assert body["scores"][0]["final_score"] == 1.0
    assert body["scores"][1]["final_score"] == 0.166666
    assert "average of truth" in body["scores"][0]["neutrosophic_explanations"]["stock"]
