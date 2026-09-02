"""Neutrosophic truth, indeterminacy, and falsity structures."""

from pydantic import BaseModel, ConfigDict, Field


class NeutrosophicTriple(BaseModel):
    """Truth/indeterminacy/falsity values for uncertain logistics evidence."""

    model_config = ConfigDict(frozen=True)

    truth: float = Field(ge=0.0, le=1.0, description="Truth-membership degree in [0, 1].")
    indeterminacy: float = Field(
        ge=0.0, le=1.0, description="Indeterminacy-membership degree in [0, 1]."
    )
    falsity: float = Field(ge=0.0, le=1.0, description="Falsity-membership degree in [0, 1].")


class NeutrosophicScore(BaseModel):
    """Deterministic neutrosophic score plus its audit explanation."""

    model_config = ConfigDict(frozen=True)

    score: float = Field(
        ge=0.0, le=1.0, description="Deterministic score derived from the neutrosophic triple."
    )
    explanation: str = Field(description="Human-readable formula explanation for the score.")


def explain_triple_score(triple: NeutrosophicTriple) -> NeutrosophicScore:
    """Convert a neutrosophic triple into an explainable deterministic [0, 1] score.

    Formula:
        score = (truth + (1 - indeterminacy) + (1 - falsity)) / 3

    Assumption: higher truth improves the logistics signal, while higher indeterminacy and
    higher falsity reduce confidence. The score is rounded to six decimals for stable output.
    """

    score = round(
        (triple.truth + (1.0 - triple.indeterminacy) + (1.0 - triple.falsity)) / 3.0,
        6,
    )
    explanation = (
        "Neutrosophic score is the average of truth, one minus indeterminacy, and one "
        f"minus falsity: ({triple.truth:.6f} + {1.0 - triple.indeterminacy:.6f} + "
        f"{1.0 - triple.falsity:.6f}) / 3 = {score:.6f}."
    )
    return NeutrosophicScore(score=score, explanation=explanation)


def score_triple(triple: NeutrosophicTriple) -> float:
    """Convert a neutrosophic triple into a deterministic [0, 1] score."""

    return explain_triple_score(triple).score
