"""Professor schemas."""

from pydantic import BaseModel, ConfigDict, Field


class ProfessorBase(BaseModel):
    """Base professor schema with shared fields."""

    name: str = Field(..., min_length=1, description="Professor name")
    university_id: int = Field(..., description="University ID where professor teaches")


class ProfessorCreate(ProfessorBase):
    """Schema for creating a professor."""

    pass


class Professor(ProfessorBase):
    """Professor response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Professor ID")
    university: str = Field(..., description="University name where professor teaches")
    review_count: int = Field(..., ge=0, description="Number of reviews for this professor")
