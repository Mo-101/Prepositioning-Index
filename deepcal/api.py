"""FastAPI application for DeepCAL."""

from fastapi import FastAPI

from deepcal.decision import DecisionRankRequest, DecisionRankResult, rank_decisions
from deepcal.grey import GreyRankRequest, GreyRankResult, grey_relational_analysis
from deepcal.models import HealthResult, ReadinessInput, ReadinessResult
from deepcal.scoring import calculate_readiness

app = FastAPI(
    title="DeepCAL Logistics Engine",
    description="Deterministic emergency-logistics scoring and decision support API.",
    version="0.1.0",
)


@app.get("/health", response_model=HealthResult)
def health() -> HealthResult:
    """Return service health for deployment checks."""

    return HealthResult(status="ok", service="deepcal")


@app.post("/readiness", response_model=ReadinessResult)
def readiness_score(payload: ReadinessInput) -> ReadinessResult:
    """Calculate a readiness score with explanation."""

    return calculate_readiness(payload)


@app.post("/grey/rank", response_model=GreyRankResult)
def grey_rank(payload: GreyRankRequest) -> GreyRankResult:
    """Rank alternatives with Grey Relational Analysis."""

    return grey_relational_analysis(payload)


@app.post("/decision/rank", response_model=DecisionRankResult)
def decision_rank(payload: DecisionRankRequest) -> DecisionRankResult:
    """Rank alternatives with the Neutrosophic Grey decision pipeline."""

    return rank_decisions(payload)
