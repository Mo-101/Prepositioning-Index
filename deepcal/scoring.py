"""Scoring algorithms for the DeepCAL logistics engine."""

from deepcal.models import ReadinessInput, ReadinessResult


def calculate_readiness(readiness: ReadinessInput) -> ReadinessResult:
    """Calculate the deterministic DeepCAL readiness index.

    Formula:
        score = Σ(normalized_weight_i × criterion_i)

    Assumptions:
        * Each criterion is already normalized to [0, 1], where 1 means best readiness.
        * User-provided weights are non-negative and are normalized internally so that their
          sum equals 1.0.
        * The result is rounded to six decimal places for stable API and test output.

    Returns both the score and an explanation so downstream recommendations are auditable.
    """

    values = {
        "inventory_coverage": readiness.inventory_coverage,
        "route_reliability": readiness.route_reliability,
        "facility_condition": readiness.facility_condition,
        "demand_urgency": readiness.demand_urgency,
    }
    weight_total = sum(readiness.weights.values())
    normalized_weights = {name: weight / weight_total for name, weight in readiness.weights.items()}
    contributions = {name: values[name] * normalized_weights[name] for name in values}
    score = round(sum(contributions.values()), 6)
    rounded_contributions = {name: round(value, 6) for name, value in contributions.items()}
    rounded_weights = {name: round(value, 6) for name, value in normalized_weights.items()}
    strongest = max(rounded_contributions, key=lambda name: rounded_contributions[name])
    weakest = min(values, key=lambda name: values[name])
    explanation = (
        "Readiness is the weighted sum of normalized logistics criteria. "
        f"The largest contribution is {strongest} "
        f"({rounded_contributions[strongest]:.6f}); the lowest raw criterion is "
        f"{weakest} ({values[weakest]:.6f})."
    )
    return ReadinessResult(
        score=score,
        normalized_weights=rounded_weights,
        contributions=rounded_contributions,
        explanation=explanation,
    )
