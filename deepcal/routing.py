"""Route risk, time, cost, and reliability scoring helpers."""

from deepcal.models import Route


def route_composite_score(route: Route) -> tuple[float, str]:
    """Score a route using reliability and risk.

    Formula:
        score = reliability × (1 - risk_score)

    This intentionally simple deterministic formula rewards reliable routes and penalizes
    routes with higher disruption risk.
    """

    score = round(route.reliability * (1.0 - route.risk_score), 6)
    explanation = (
        "Route score equals reliability multiplied by one minus risk_score: "
        f"{route.reliability:.6f} × {1.0 - route.risk_score:.6f}."
    )
    return score, explanation
