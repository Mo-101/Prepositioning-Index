"""Grey Theory calculations for limited or uncertain logistics data."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

CriterionType = Literal["benefit", "cost"]
NumberOrMissing = float | None


class GreyRankRequest(BaseModel):
    """Request payload for Grey Relational Analysis ranking."""

    model_config = ConfigDict(frozen=True)

    alternatives: list[str] = Field(
        min_length=1, description="Alternative names in matrix row order."
    )
    criteria: list[str] = Field(min_length=1, description="Criterion names in matrix column order.")
    matrix: list[list[NumberOrMissing]] = Field(
        min_length=1,
        description=(
            "Decision matrix; rows are alternatives and columns are criteria. "
            "Use null for missing values."
        ),
    )
    criterion_types: dict[str, CriterionType] = Field(
        description=(
            "Criterion direction keyed by criterion name: benefit means higher is better, "
            "cost means lower is better."
        )
    )
    weights: dict[str, float] | None = Field(
        default=None,
        description=(
            "Optional non-negative criterion weights keyed by criterion name; "
            "equal weights are used when omitted."
        ),
    )
    rho: float = Field(
        default=0.5,
        gt=0.0,
        le=1.0,
        description="Grey distinguishing coefficient in (0, 1]; default 0.5.",
    )

    @field_validator("alternatives", "criteria")
    @classmethod
    def validate_unique_names(cls, values: list[str]) -> list[str]:
        if any(not value for value in values):
            raise ValueError("names must be non-empty")
        if len(set(values)) != len(values):
            raise ValueError("names must be unique")
        return values

    @model_validator(mode="after")
    def validate_dimensions(self) -> "GreyRankRequest":
        validate_grey_inputs(
            alternatives=self.alternatives,
            criteria=self.criteria,
            matrix=self.matrix,
            criterion_types=self.criterion_types,
            weights=self.weights,
        )
        return self


class GreyRankResult(BaseModel):
    """Grey Relational Analysis output with auditable intermediate matrices."""

    model_config = ConfigDict(frozen=True)

    normalized_matrix: list[list[float]] = Field(
        description="Benefit/cost normalized matrix in [0, 1]."
    )
    grey_relational_coefficients: list[list[float]] = Field(
        description="Grey relational coefficient matrix against the ideal reference sequence."
    )
    grey_relational_grades: dict[str, float] = Field(
        description="Weighted grey relational grade for each alternative."
    )
    ranking: list[str] = Field(description="Alternatives ranked from highest to lowest grey grade.")
    explanation: str = Field(
        description=(
            "Human-readable explanation of normalization, coefficients, grades, and ranking."
        )
    )


def validate_grey_inputs(
    *,
    alternatives: list[str],
    criteria: list[str],
    matrix: list[list[NumberOrMissing]],
    criterion_types: dict[str, CriterionType],
    weights: dict[str, float] | None = None,
) -> None:
    """Validate dimensions and criterion metadata for Grey calculations."""

    if len(matrix) != len(alternatives):
        raise ValueError("matrix row count must match alternatives")
    expected_width = len(criteria)
    for row in matrix:
        if len(row) != expected_width:
            raise ValueError("each matrix row must match criteria length")
    missing_types = set(criteria) - set(criterion_types)
    extra_types = set(criterion_types) - set(criteria)
    if missing_types or extra_types:
        raise ValueError("criterion_types must contain exactly the criteria names")
    if weights is not None:
        missing_weights = set(criteria) - set(weights)
        extra_weights = set(weights) - set(criteria)
        if missing_weights or extra_weights:
            raise ValueError("weights must contain exactly the criteria names")
        if any(weight < 0 for weight in weights.values()):
            raise ValueError("weights must be non-negative")
        if sum(weights.values()) <= 0:
            raise ValueError("at least one criterion weight must be positive")


def normalize_weights(criteria: list[str], weights: dict[str, float] | None) -> dict[str, float]:
    """Return criterion weights normalized to sum to 1.0."""

    if weights is None:
        equal_weight = 1.0 / len(criteria)
        return {criterion: equal_weight for criterion in criteria}
    total = sum(weights.values())
    return {criterion: weights[criterion] / total for criterion in criteria}


def impute_missing_values(matrix: list[list[NumberOrMissing]]) -> tuple[list[list[float]], int]:
    """Replace missing matrix values with deterministic column means.

    Assumption: a missing logistics value is represented by ``None``. Missing entries are
    imputed with the arithmetic mean of observed values in the same criterion column. A column
    with no observed values is rejected because no deterministic criterion signal exists.
    """

    if not matrix:
        raise ValueError("matrix must not be empty")
    column_count = len(matrix[0])
    columns = [[row[column_index] for row in matrix] for column_index in range(column_count)]
    means: list[float] = []
    missing_count = 0
    for column in columns:
        observed = [value for value in column if value is not None]
        missing_count += len(column) - len(observed)
        if not observed:
            raise ValueError("each criterion column must contain at least one observed value")
        means.append(sum(observed) / len(observed))
    imputed: list[list[float]] = []
    for row in matrix:
        imputed_row: list[float] = []
        for column_index in range(column_count):
            value = row[column_index]
            imputed_row.append(value if value is not None else means[column_index])
        imputed.append(imputed_row)
    return imputed, missing_count


def normalize_matrix(
    matrix: list[list[NumberOrMissing]],
    criteria: list[str],
    criterion_types: dict[str, CriterionType],
) -> tuple[list[list[float]], int]:
    """Normalize a decision matrix for Grey Relational Analysis.

    Benefit criteria use ``(x - min) / (max - min)`` and cost criteria use
    ``(max - x) / (max - min)`` so every normalized value is in [0, 1] and higher is better.
    Zero-variance columns are set to 1.0 for every alternative because all alternatives are
    indistinguishable on that criterion.
    """

    imputed, missing_count = impute_missing_values(matrix)
    normalized = [[0.0 for _ in criteria] for _ in imputed]
    for column_index, criterion in enumerate(criteria):
        column = [row[column_index] for row in imputed]
        min_value = min(column)
        max_value = max(column)
        span = max_value - min_value
        if span == 0:
            for row_index in range(len(imputed)):
                normalized[row_index][column_index] = 1.0
            continue
        for row_index, row in enumerate(imputed):
            value = row[column_index]
            if criterion_types[criterion] == "benefit":
                normalized[row_index][column_index] = (value - min_value) / span
            else:
                normalized[row_index][column_index] = (max_value - value) / span
    return [[round(value, 6) for value in row] for row in normalized], missing_count


def calculate_grey_coefficients(
    normalized_matrix: list[list[float]],
    rho: float = 0.5,
) -> list[list[float]]:
    """Calculate grey relational coefficients against the ideal reference sequence.

    Formula:
        coefficient = (Δmin + ρ × Δmax) / (Δij + ρ × Δmax)

    The reference sequence is all ones because normalized criteria are transformed so higher is
    better. ``rho`` is the distinguishing coefficient and must be in (0, 1].
    """

    if rho <= 0 or rho > 1:
        raise ValueError("rho must be greater than 0 and less than or equal to 1")
    deltas = [[abs(1.0 - value) for value in row] for row in normalized_matrix]
    flat_deltas = [delta for row in deltas for delta in row]
    min_delta = min(flat_deltas)
    max_delta = max(flat_deltas)
    if max_delta == 0:
        return [[1.0 for _ in row] for row in normalized_matrix]
    coefficients = [
        [(min_delta + rho * max_delta) / (delta + rho * max_delta) for delta in row]
        for row in deltas
    ]
    return [[round(value, 6) for value in row] for row in coefficients]


def grey_relational_analysis(request: GreyRankRequest) -> GreyRankResult:
    """Run deterministic Grey Relational Analysis and return ranking details."""

    normalized_matrix, missing_count = normalize_matrix(
        request.matrix, request.criteria, request.criterion_types
    )
    coefficients = calculate_grey_coefficients(normalized_matrix, request.rho)
    normalized_weights = normalize_weights(request.criteria, request.weights)
    grades = {
        alternative: round(
            sum(
                coefficients[row_index][column_index] * normalized_weights[criterion]
                for column_index, criterion in enumerate(request.criteria)
            ),
            6,
        )
        for row_index, alternative in enumerate(request.alternatives)
    }
    ranking = sorted(
        request.alternatives, key=lambda alternative: grades[alternative], reverse=True
    )
    explanation = (
        "Grey Relational Analysis normalized benefit and cost criteria to [0, 1], compared "
        f"each alternative with an all-one ideal sequence using rho={request.rho:.3f}, and "
        "ranked alternatives by weighted grey relational grade. "
        f"Missing values imputed by column mean: {missing_count}."
    )
    return GreyRankResult(
        normalized_matrix=normalized_matrix,
        grey_relational_coefficients=coefficients,
        grey_relational_grades=grades,
        ranking=ranking,
        explanation=explanation,
    )
