import pytest
from pydantic import ValidationError

from deepcal.grey import GreyRankRequest, calculate_grey_coefficients, grey_relational_analysis


def test_known_hand_calculated_gra_ranking() -> None:
    """Hand calculation: C=0.8, A=0.7, B=0.333333 with rho=0.5."""

    result = grey_relational_analysis(
        GreyRankRequest(
            alternatives=["A", "B", "C"],
            criteria=["coverage", "cost"],
            matrix=[[80.0, 10.0], [60.0, 20.0], [100.0, 15.0]],
            criterion_types={"coverage": "benefit", "cost": "cost"},
            weights={"coverage": 0.6, "cost": 0.4},
            rho=0.5,
        )
    )

    assert result.normalized_matrix == [[0.5, 1.0], [0.0, 0.0], [1.0, 0.5]]
    assert result.grey_relational_coefficients == [
        [0.5, 1.0],
        [0.333333, 0.333333],
        [1.0, 0.5],
    ]
    assert result.grey_relational_grades == {"A": 0.7, "B": 0.333333, "C": 0.8}
    assert result.ranking == ["C", "A", "B"]


def test_equal_alternatives_and_zero_variance_columns_tie() -> None:
    result = grey_relational_analysis(
        GreyRankRequest(
            alternatives=["a", "b"],
            criteria=["coverage", "cost"],
            matrix=[[10.0, 5.0], [10.0, 5.0]],
            criterion_types={"coverage": "benefit", "cost": "cost"},
        )
    )

    assert result.normalized_matrix == [[1.0, 1.0], [1.0, 1.0]]
    assert result.grey_relational_coefficients == [[1.0, 1.0], [1.0, 1.0]]
    assert result.grey_relational_grades == {"a": 1.0, "b": 1.0}
    assert result.ranking == ["a", "b"]


def test_cost_and_benefit_criteria_normalize_in_correct_directions() -> None:
    result = grey_relational_analysis(
        GreyRankRequest(
            alternatives=["fast-expensive", "slow-cheap"],
            criteria=["speed", "cost"],
            matrix=[[9.0, 100.0], [4.0, 40.0]],
            criterion_types={"speed": "benefit", "cost": "cost"},
            weights={"speed": 0.5, "cost": 0.5},
        )
    )

    assert result.normalized_matrix == [[1.0, 0.0], [0.0, 1.0]]
    assert result.grey_relational_coefficients == [[1.0, 0.333333], [0.333333, 1.0]]
    assert result.grey_relational_grades == {"fast-expensive": 0.666667, "slow-cheap": 0.666667}


def test_missing_values_are_imputed_by_column_mean() -> None:
    result = grey_relational_analysis(
        GreyRankRequest(
            alternatives=["a", "b", "c"],
            criteria=["coverage"],
            matrix=[[1.0], [None], [3.0]],
            criterion_types={"coverage": "benefit"},
        )
    )

    assert result.normalized_matrix == [[0.0], [0.5], [1.0]]
    assert result.grey_relational_coefficients == [[0.333333], [0.5], [1.0]]
    assert result.grey_relational_grades == {"a": 0.333333, "b": 0.5, "c": 1.0}
    assert "Missing values imputed by column mean: 1" in result.explanation


def test_invalid_rho_is_rejected() -> None:
    with pytest.raises(ValidationError):
        GreyRankRequest(
            alternatives=["a"],
            criteria=["coverage"],
            matrix=[[1.0]],
            criterion_types={"coverage": "benefit"},
            rho=0.0,
        )
    with pytest.raises(ValueError, match="rho"):
        calculate_grey_coefficients([[1.0]], rho=1.5)


def test_invalid_weights_are_rejected() -> None:
    with pytest.raises(ValidationError, match="criteria names"):
        GreyRankRequest(
            alternatives=["a"],
            criteria=["coverage"],
            matrix=[[1.0]],
            criterion_types={"coverage": "benefit"},
            weights={"wrong": 1.0},
        )
    with pytest.raises(ValidationError, match="non-negative"):
        GreyRankRequest(
            alternatives=["a"],
            criteria=["coverage"],
            matrix=[[1.0]],
            criterion_types={"coverage": "benefit"},
            weights={"coverage": -1.0},
        )
    with pytest.raises(ValidationError, match="positive"):
        GreyRankRequest(
            alternatives=["a"],
            criteria=["coverage"],
            matrix=[[1.0]],
            criterion_types={"coverage": "benefit"},
            weights={"coverage": 0.0},
        )


def test_ranking_order_correctness() -> None:
    result = grey_relational_analysis(
        GreyRankRequest(
            alternatives=["weak", "strong"],
            criteria=["coverage", "cost"],
            matrix=[[0.2, 100.0], [0.9, 50.0]],
            criterion_types={"coverage": "benefit", "cost": "cost"},
        )
    )

    assert result.grey_relational_grades == {"weak": 0.333333, "strong": 1.0}
    assert result.ranking == ["strong", "weak"]
