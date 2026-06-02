"""Combined Neutrosophic Grey AHP-TOPSIS style ranking pipeline."""

from math import sqrt

from pydantic import BaseModel, ConfigDict, Field, model_validator

from deepcal.grey import CriterionType, GreyRankRequest, grey_relational_analysis, normalize_weights
from deepcal.neutrosophic import NeutrosophicTriple, explain_triple_score


class DecisionRankRequest(BaseModel):
    """Request for combined neutrosophic, Grey, and TOPSIS ranking."""

    model_config = ConfigDict(frozen=True)

    alternatives: list[str] = Field(
        min_length=1, description="Alternative names in uncertainty_triples row order."
    )
    criteria: list[str] = Field(
        min_length=1, description="Criterion names in uncertainty_triples column order."
    )
    criteria_weights: dict[str, float] = Field(
        description="Non-negative AHP-style criterion weights keyed by criterion name."
    )
    criterion_types: dict[str, CriterionType] = Field(
        description="Criterion direction keyed by criterion name: benefit or cost."
    )
    uncertainty_triples: list[list[NeutrosophicTriple]] = Field(
        min_length=1,
        description=(
            "Matrix of neutrosophic triples; rows are alternatives and columns are criteria."
        ),
    )
    rho: float = Field(
        default=0.5,
        gt=0.0,
        le=1.0,
        description="Grey distinguishing coefficient in (0, 1]; default 0.5.",
    )

    @model_validator(mode="after")
    def validate_dimensions(self) -> "DecisionRankRequest":
        if len(set(self.alternatives)) != len(self.alternatives):
            raise ValueError("alternatives must be unique")
        if len(set(self.criteria)) != len(self.criteria):
            raise ValueError("criteria must be unique")
        if len(self.uncertainty_triples) != len(self.alternatives):
            raise ValueError("uncertainty_triples row count must match alternatives")
        for row in self.uncertainty_triples:
            if len(row) != len(self.criteria):
                raise ValueError("each uncertainty_triples row must match criteria length")
        expected = set(self.criteria)
        if set(self.criteria_weights) != expected:
            raise ValueError("criteria_weights must contain exactly the criteria names")
        if set(self.criterion_types) != expected:
            raise ValueError("criterion_types must contain exactly the criteria names")
        if any(weight < 0 for weight in self.criteria_weights.values()):
            raise ValueError("criteria_weights must be non-negative")
        if sum(self.criteria_weights.values()) <= 0:
            raise ValueError("at least one criterion weight must be positive")
        return self


class AlternativeDecisionScore(BaseModel):
    """Explainable score for one ranked alternative."""

    model_config = ConfigDict(frozen=True)

    alternative: str = Field(description="Alternative name.")
    neutrosophic_scores: dict[str, float] = Field(
        description="Per-criterion deterministic scores derived from neutrosophic triples."
    )
    neutrosophic_explanations: dict[str, str] = Field(
        description="Per-criterion neutrosophic scoring explanations."
    )
    grey_grade: float = Field(description="Weighted grey relational grade.")
    topsis_closeness: float = Field(description="TOPSIS closeness coefficient in [0, 1].")
    final_score: float = Field(
        description="Final score: average of grey grade and TOPSIS closeness."
    )
    rank: int = Field(description="One-based rank after sorting by final_score.")
    explanation: str = Field(description="Human-readable ranking explanation.")


class DecisionRankResult(BaseModel):
    """Combined decision result with Grey and TOPSIS scoring details."""

    model_config = ConfigDict(frozen=True)

    ranking: list[str] = Field(
        description="Alternatives ranked from highest to lowest final score."
    )
    scores: list[AlternativeDecisionScore] = Field(
        description="Per-alternative scoring breakdowns."
    )
    normalized_matrix: list[list[float]] = Field(
        description="Grey-normalized matrix after neutrosophic scoring."
    )
    grey_relational_coefficients: list[list[float]] = Field(
        description="Grey relational coefficient matrix."
    )
    grey_relational_grades: dict[str, float] = Field(
        description="Weighted grey relational grade by alternative."
    )
    topsis_closeness: dict[str, float] = Field(
        description="TOPSIS closeness coefficient by alternative."
    )
    explanation: str = Field(description="Human-readable explanation of the decision pipeline.")


def _neutrosophic_score_details(
    request: DecisionRankRequest,
) -> tuple[list[list[float]], list[list[str]]]:
    score_matrix: list[list[float]] = []
    explanation_matrix: list[list[str]] = []
    for row in request.uncertainty_triples:
        score_row: list[float] = []
        explanation_row: list[str] = []
        for triple in row:
            score = explain_triple_score(triple)
            score_row.append(score.score)
            explanation_row.append(score.explanation)
        score_matrix.append(score_row)
        explanation_matrix.append(explanation_row)
    return score_matrix, explanation_matrix


def _weighted_normalized_matrix(
    normalized_matrix: list[list[float]], criteria: list[str], weights: dict[str, float]
) -> list[list[float]]:
    normalized_weights = normalize_weights(criteria, weights)
    return [
        [
            row[column_index] * normalized_weights[criterion]
            for column_index, criterion in enumerate(criteria)
        ]
        for row in normalized_matrix
    ]


def _topsis_closeness(
    alternatives: list[str], weighted_matrix: list[list[float]]
) -> dict[str, float]:
    """Calculate TOPSIS closeness after criteria have been normalized as benefits."""

    column_count = len(weighted_matrix[0])
    positive_ideal = [
        max(row[column_index] for row in weighted_matrix) for column_index in range(column_count)
    ]
    negative_ideal = [
        min(row[column_index] for row in weighted_matrix) for column_index in range(column_count)
    ]
    closeness: dict[str, float] = {}
    for row_index, alternative in enumerate(alternatives):
        row = weighted_matrix[row_index]
        distance_positive = sqrt(
            sum(
                (row[column_index] - positive_ideal[column_index]) ** 2
                for column_index in range(column_count)
            )
        )
        distance_negative = sqrt(
            sum(
                (row[column_index] - negative_ideal[column_index]) ** 2
                for column_index in range(column_count)
            )
        )
        denominator = distance_positive + distance_negative
        closeness[alternative] = round(
            1.0 if denominator == 0 else distance_negative / denominator, 6
        )
    return closeness


def rank_decisions(request: DecisionRankRequest) -> DecisionRankResult:
    """Run the deterministic Neutrosophic Grey AHP-TOPSIS style pipeline.

    Steps:
        1. Convert each truth/indeterminacy/falsity triple into a crisp score.
        2. Apply Grey benefit/cost normalization and grey relational coefficients.
        3. Apply TOPSIS closeness on the same weighted normalized matrix.
        4. Average grey grade and TOPSIS closeness for the final ranking score.

    Assumption: supplied criterion weights are AHP-style priorities from the caller; DeepCAL
    normalizes them rather than deriving pairwise-comparison weights in this basic pipeline.
    """

    score_matrix, explanation_matrix = _neutrosophic_score_details(request)
    grey_result = grey_relational_analysis(
        GreyRankRequest(
            alternatives=request.alternatives,
            criteria=request.criteria,
            matrix=score_matrix,
            criterion_types=request.criterion_types,
            weights=request.criteria_weights,
            rho=request.rho,
        )
    )
    weighted_matrix = _weighted_normalized_matrix(
        grey_result.normalized_matrix, request.criteria, request.criteria_weights
    )
    closeness = _topsis_closeness(request.alternatives, weighted_matrix)
    final_scores = {
        alternative: round(
            (grey_result.grey_relational_grades[alternative] + closeness[alternative]) / 2.0, 6
        )
        for alternative in request.alternatives
    }
    ranking = sorted(
        request.alternatives, key=lambda alternative: final_scores[alternative], reverse=True
    )
    score_items: list[AlternativeDecisionScore] = []
    for rank_index, alternative in enumerate(ranking, start=1):
        row_index = request.alternatives.index(alternative)
        criterion_scores = {
            criterion: score_matrix[row_index][column_index]
            for column_index, criterion in enumerate(request.criteria)
        }
        criterion_explanations = {
            criterion: explanation_matrix[row_index][column_index]
            for column_index, criterion in enumerate(request.criteria)
        }
        score_items.append(
            AlternativeDecisionScore(
                alternative=alternative,
                neutrosophic_scores=criterion_scores,
                neutrosophic_explanations=criterion_explanations,
                grey_grade=grey_result.grey_relational_grades[alternative],
                topsis_closeness=closeness[alternative],
                final_score=final_scores[alternative],
                rank=rank_index,
                explanation=(
                    f"{alternative} ranked #{rank_index} from the average of grey grade "
                    f"{grey_result.grey_relational_grades[alternative]:.6f} and TOPSIS "
                    f"closeness {closeness[alternative]:.6f}."
                ),
            )
        )
    return DecisionRankResult(
        ranking=ranking,
        scores=score_items,
        normalized_matrix=grey_result.normalized_matrix,
        grey_relational_coefficients=grey_result.grey_relational_coefficients,
        grey_relational_grades=grey_result.grey_relational_grades,
        topsis_closeness=closeness,
        explanation=(
            "Neutrosophic triples were converted to deterministic scores, normalized by "
            "benefit/cost criterion type, evaluated with Grey Relational Analysis, and "
            "combined with TOPSIS closeness for explainable emergency decision ranking."
        ),
    )
