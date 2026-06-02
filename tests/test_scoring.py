import pytest
from pydantic import ValidationError

from deepcal.models import ReadinessInput
from deepcal.scoring import calculate_readiness


def test_calculate_readiness_returns_score_and_explanation() -> None:
    result = calculate_readiness(
        ReadinessInput(
            inventory_coverage=0.82,
            route_reliability=0.74,
            facility_condition=0.91,
            demand_urgency=0.65,
        )
    )

    assert result.score == 0.784
    assert result.contributions == {
        "inventory_coverage": 0.287,
        "route_reliability": 0.185,
        "facility_condition": 0.182,
        "demand_urgency": 0.13,
    }
    assert "weighted sum" in result.explanation


def test_calculate_readiness_normalizes_weights() -> None:
    result = calculate_readiness(
        ReadinessInput(
            inventory_coverage=1.0,
            route_reliability=0.0,
            facility_condition=0.0,
            demand_urgency=0.0,
            weights={
                "inventory_coverage": 2.0,
                "route_reliability": 1.0,
                "facility_condition": 1.0,
                "demand_urgency": 0.0,
            },
        )
    )

    assert result.score == 0.5
    assert result.normalized_weights["inventory_coverage"] == 0.5


def test_readiness_rejects_invalid_weight_keys() -> None:
    with pytest.raises(ValidationError):
        ReadinessInput(
            inventory_coverage=1.0,
            route_reliability=1.0,
            facility_condition=1.0,
            demand_urgency=1.0,
            weights={"inventory_coverage": 1.0},
        )


def test_readiness_rejects_out_of_range_criteria() -> None:
    with pytest.raises(ValidationError):
        ReadinessInput(
            inventory_coverage=1.2,
            route_reliability=1.0,
            facility_condition=1.0,
            demand_urgency=1.0,
        )
