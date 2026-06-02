"""FastAPI application for DeepCAL."""

from fastapi import FastAPI

from deepcal.models import ReadinessInput, ReadinessResult
from deepcal.scoring import calculate_readiness

app = FastAPI(
    title="DeepCAL Logistics Engine",
    description="Deterministic emergency-logistics scoring and decision support API.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    """Return service health for deployment checks."""

    return {"status": "ok", "service": "deepcal"}


@app.post("/readiness", response_model=ReadinessResult)
def readiness_score(payload: ReadinessInput) -> ReadinessResult:
    """Calculate a readiness score with explanation."""

    return calculate_readiness(payload)
