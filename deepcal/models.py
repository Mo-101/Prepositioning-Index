"""Pydantic schemas for deterministic DeepCAL logistics calculations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

CriterionDirection = Literal["benefit", "cost"]


class HealthResult(BaseModel):
    """Service health response for deployment checks."""

    model_config = ConfigDict(frozen=True)

    status: str = Field(description="Service status; `ok` means the API process is reachable.")
    service: str = Field(description="Internal service/package identifier.")


class Location(BaseModel):
    """Geographic point used for facilities, demand sites, and route endpoints."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1, description="Stable unique identifier for this location.")
    name: str = Field(min_length=1, description="Human-readable location name.")
    latitude: float = Field(ge=-90.0, le=90.0, description="Latitude in decimal degrees.")
    longitude: float = Field(ge=-180.0, le=180.0, description="Longitude in decimal degrees.")


class InventoryItem(BaseModel):
    """Inventory line for emergency supplies at a facility."""

    model_config = ConfigDict(frozen=True)

    sku: str = Field(min_length=1, description="Stock keeping unit or supply item identifier.")
    description: str = Field(min_length=1, description="Supply item description.")
    quantity: float = Field(ge=0.0, description="Available quantity; must be non-negative.")
    unit: str = Field(min_length=1, description="Measurement unit for the quantity.")


class DemandEstimate(BaseModel):
    """Demand estimate for one SKU over a planning horizon."""

    model_config = ConfigDict(frozen=True)

    location_id: str = Field(min_length=1, description="Demand location identifier.")
    sku: str = Field(min_length=1, description="Stock keeping unit or supply item identifier.")
    required_quantity: float = Field(
        ge=0.0, description="Required quantity over the planning horizon."
    )
    horizon_days: int = Field(gt=0, description="Planning horizon in days.")


class Route(BaseModel):
    """Candidate logistics route with deterministic planning attributes."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1, description="Stable unique route identifier.")
    origin_id: str = Field(min_length=1, description="Origin location identifier.")
    destination_id: str = Field(min_length=1, description="Destination location identifier.")
    distance_km: float = Field(ge=0.0, description="Route distance in kilometers.")
    travel_time_hours: float = Field(ge=0.0, description="Estimated route travel time in hours.")
    cost_usd: float = Field(ge=0.0, description="Estimated route cost in US dollars.")
    risk_score: float = Field(
        ge=0.0, le=1.0, description="Normalized disruption risk where 1 is highest risk."
    )
    reliability: float = Field(
        ge=0.0, le=1.0, description="Normalized route reliability where 1 is best."
    )


class Constraint(BaseModel):
    """Operational constraint that can be attached to decisions or routes."""

    model_config = ConfigDict(frozen=True)

    name: str = Field(min_length=1, description="Constraint name.")
    value: float = Field(description="Constraint value.")
    unit: str = Field(min_length=1, description="Constraint measurement unit.")


class ReadinessInput(BaseModel):
    """Inputs for the readiness index.

    The weighted arithmetic mean is computed from values already normalized to the [0, 1]
    interval. Weights must be non-negative and at least one weight must be positive.
    """

    model_config = ConfigDict(frozen=True)

    inventory_coverage: float = Field(
        ge=0.0, le=1.0, description="Normalized stock coverage where 1 means fully covered."
    )
    route_reliability: float = Field(
        ge=0.0, le=1.0, description="Normalized route reliability where 1 is best."
    )
    facility_condition: float = Field(
        ge=0.0, le=1.0, description="Normalized facility readiness/condition where 1 is best."
    )
    demand_urgency: float = Field(
        ge=0.0, le=1.0, description="Normalized urgency signal where 1 is most urgent."
    )
    weights: dict[str, float] = Field(
        default_factory=lambda: {
            "inventory_coverage": 0.35,
            "route_reliability": 0.25,
            "facility_condition": 0.20,
            "demand_urgency": 0.20,
        },
        description="Non-negative criterion weights keyed by readiness input name.",
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

    score: float = Field(ge=0.0, le=1.0, description="Final normalized readiness score.")
    normalized_weights: dict[str, float] = Field(
        description="Readiness weights normalized to sum to 1."
    )
    contributions: dict[str, float] = Field(
        description="Per-criterion weighted score contributions."
    )
    explanation: str = Field(description="Human-readable scoring explanation.")
