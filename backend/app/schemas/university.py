"""University schemas."""

from pydantic import BaseModel, ConfigDict, Field


class UniversityBase(BaseModel):
    """Base university schema with shared fields."""

    name: str = Field(..., min_length=1, description="University name")


class UniversityCreate(UniversityBase):
    """Schema for creating a university."""

    pass


class University(UniversityBase):
    """University response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="University ID")
    review_count: int = Field(..., ge=0, description="Number of reviews for this university")
