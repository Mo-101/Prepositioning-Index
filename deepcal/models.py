"""Pydantic schemas for deterministic DeepCAL logistics calculations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

CriterionDirection = Literal["benefit", "cost"]


class Location(BaseModel):
    """Geographic point used for facilities, demand sites, and route endpoints."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)


class InventoryItem(BaseModel):
    """Inventory line for emergency supplies at a facility."""

    model_config = ConfigDict(frozen=True)

    sku: str = Field(min_length=1)
    description: str = Field(min_length=1)
    quantity: float = Field(ge=0.0)
    unit: str = Field(min_length=1)


class DemandEstimate(BaseModel):
    """Demand estimate for one SKU over a planning horizon."""

    model_config = ConfigDict(frozen=True)

    location_id: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    required_quantity: float = Field(ge=0.0)
    horizon_days: int = Field(gt=0)


class Route(BaseModel):
    """Candidate logistics route with deterministic planning attributes."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    origin_id: str = Field(min_length=1)
    destination_id: str = Field(min_length=1)
    distance_km: float = Field(ge=0.0)
    travel_time_hours: float = Field(ge=0.0)
    cost_usd: float = Field(ge=0.0)
    risk_score: float = Field(ge=0.0, le=1.0)
    reliability: float = Field(ge=0.0, le=1.0)


class Constraint(BaseModel):
    """Operational constraint that can be attached to decisions or routes."""

    model_config = ConfigDict(frozen=True)

    name: str = Field(min_length=1)
    value: float
    unit: str = Field(min_length=1)


class ReadinessInput(BaseModel):
    """Inputs for the readiness index.

    The weighted arithmetic mean is computed from values already normalized to the [0, 1]
    interval. Weights must be non-negative and at least one weight must be positive.
    """

    model_config = ConfigDict(frozen=True)

    inventory_coverage: float = Field(ge=0.0, le=1.0)
    route_reliability: float = Field(ge=0.0, le=1.0)
    facility_condition: float = Field(ge=0.0, le=1.0)
    demand_urgency: float = Field(ge=0.0, le=1.0)
    weights: dict[str, float] = Field(
        default_factory=lambda: {
            "inventory_coverage": 0.35,
            "route_reliability": 0.25,
            "facility_condition": 0.20,
            "demand_urgency": 0.20,
        }
    )

    @field_validator("weights")
    @classmethod
    def validate_weights(cls, weights: dict[str, float]) -> dict[str, float]:
        expected = {
            "inventory_coverage",
            "route_reliability",
            "facility_condition",
            "demand_urgency",
        }
        missing = expected - set(weights)
        extra = set(weights) - expected
        if missing or extra:
            msg = (
                f"weights must contain exactly {sorted(expected)}; "
                f"missing={sorted(missing)}, extra={sorted(extra)}"
            )
            raise ValueError(msg)
        if any(weight < 0 for weight in weights.values()):
            raise ValueError("weights must be non-negative")
        if sum(weights.values()) <= 0:
            raise ValueError("at least one readiness weight must be positive")
        return weights


class ReadinessResult(BaseModel):
    """Score and human-readable explanation returned by readiness calculations."""

    model_config = ConfigDict(frozen=True)

    score: float = Field(ge=0.0, le=1.0)
    normalized_weights: dict[str, float]
    contributions: dict[str, float]
    explanation: str
