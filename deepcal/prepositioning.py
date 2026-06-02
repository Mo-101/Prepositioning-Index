"""Facility and stock placement logic placeholders for DeepCAL."""

from deepcal.models import Location


def rank_facilities_by_readiness(
    locations: list[Location], scores: dict[str, float]
) -> list[Location]:
    """Rank facilities by a caller-provided readiness score in descending order."""

    return sorted(locations, key=lambda location: scores.get(location.id, 0.0), reverse=True)
