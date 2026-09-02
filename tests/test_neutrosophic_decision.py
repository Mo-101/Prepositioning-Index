import pytest
from pydantic import ValidationError

from deepcal.decision import DecisionRankRequest, rank_decisions
from deepcal.neutrosophic import NeutrosophicTriple, explain_triple_score, score_triple


def _decision_request() -> DecisionRankRequest:
    return DecisionRankRequest(
        alternatives=["forward-hub", "mobile-cache"],
        criteria=["stock", "cost"],
        criteria_weights={"stock": 0.7, "cost": 0.3},
        criterion_types={"stock": "benefit", "cost": "cost"},
        uncertainty_triples=[
            [
                NeutrosophicTriple(truth=0.9, indeterminacy=0.1, falsity=0.1),
                NeutrosophicTriple(truth=0.3, indeterminacy=0.2, falsity=0.6),
            ],
            [
                NeutrosophicTriple(truth=0.5, indeterminacy=0.3, falsity=0.3),
                NeutrosophicTriple(truth=0.9, indeterminacy=0.1, falsity=0.1),
            ],
        ],
    )


def test_neutrosophic_triple_validation_score_and_explanation() -> None:
    triple = NeutrosophicTriple(truth=0.9, indeterminacy=0.1, falsity=0.2)

    explained = explain_triple_score(triple)

    assert score_triple(triple) == 0.866667
    assert explained.score == 0.866667
    assert "average of truth" in explained.explanation
    assert "0.866667" in explained.explanation
    with pytest.raises(ValidationError):
        NeutrosophicTriple(truth=1.2, indeterminacy=0.1, falsity=0.2)


def test_decision_pipeline_ranks_with_expected_numeric_breakdown() -> None:
    result = rank_decisions(_decision_request())

    assert result.ranking == ["forward-hub", "mobile-cache"]
    assert result.normalized_matrix == [[1.0, 1.0], [0.0, 0.0]]
    assert result.grey_relational_coefficients == [[1.0, 1.0], [0.333333, 0.333333]]
    assert result.grey_relational_grades == {"forward-hub": 1.0, "mobile-cache": 0.333333}
    assert result.topsis_closeness == {"forward-hub": 1.0, "mobile-cache": 0.0}
    assert result.scores[0].alternative == "forward-hub"
    assert result.scores[0].final_score == 1.0
    assert result.scores[1].final_score == 0.166666
    assert result.scores[0].neutrosophic_scores == {"stock": 0.9, "cost": 0.5}
    assert "average of truth" in result.scores[0].neutrosophic_explanations["stock"]
    assert "Neutrosophic triples" in result.explanation


def test_decision_pipeline_validates_dimensions() -> None:
    with pytest.raises(ValidationError):
        DecisionRankRequest(
            alternatives=["a", "b"],
            criteria=["stock"],
            criteria_weights={"stock": 1.0},
            criterion_types={"stock": "benefit"},
            uncertainty_triples=[[NeutrosophicTriple(truth=0.8, indeterminacy=0.1, falsity=0.1)]],
        )


def test_decision_pipeline_rejects_invalid_weights() -> None:
    with pytest.raises(ValidationError, match="non-negative"):
        DecisionRankRequest(
            alternatives=["a"],
            criteria=["stock"],
            criteria_weights={"stock": -1.0},
            criterion_types={"stock": "benefit"},
            uncertainty_triples=[[NeutrosophicTriple(truth=0.8, indeterminacy=0.1, falsity=0.1)]],
        )
    with pytest.raises(ValidationError, match="positive"):
        DecisionRankRequest(
            alternatives=["a"],
            criteria=["stock"],
            criteria_weights={"stock": 0.0},
            criterion_types={"stock": "benefit"},
            uncertainty_triples=[[NeutrosophicTriple(truth=0.8, indeterminacy=0.1, falsity=0.1)]],
        )
