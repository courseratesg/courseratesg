"""Review schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    """Base review schema."""

    overall_rating: float = Field(..., ge=1.0, le=5.0, description="Overall rating (1-5)")
    difficulty_rating: float = Field(..., ge=1.0, le=5.0, description="Difficulty rating (1-5)")
    workload_rating: float = Field(..., ge=1.0, le=5.0, description="Workload rating (1-5)")
    comment: str | None = Field(None, max_length=5000, description="Review comment")
    semester: str = Field(..., description="Semester (e.g., 'AY2024/25 Sem 1')")
    year: int = Field(..., ge=2000, le=2100, description="Year")

    # For API-only branch: use names/codes instead of IDs
    course_code: str = Field(..., description="Course code (e.g., 'CS5224')")
    course_name: str | None = Field(
        None,
        description=(
            "Course name (e.g., 'Cloud Computing'). "
            "Optional when creating, will be populated from course table."
        ),
    )
    university: str = Field(
        ...,
        validation_alias="university_name",  # Allow reading from DB model's university_name field
        description="University name (e.g., 'NUS')",
    )
    professor_name: str | None = Field(None, description="Professor name")


class ReviewCreate(ReviewBase):
    """Schema for creating a review."""

    pass


class ReviewUpdate(BaseModel):
    """Schema for updating a review."""

    overall_rating: float | None = Field(None, ge=1.0, le=5.0)
    difficulty_rating: float | None = Field(None, ge=1.0, le=5.0)
    workload_rating: float | None = Field(None, ge=1.0, le=5.0)
    comment: str | None = Field(None, max_length=5000)
    semester: str | None = None
    year: int | None = Field(None, ge=2000, le=2100)
    professor_name: str | None = None


class Review(ReviewBase):
    """Schema for review responses."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    user_id: str | None = Field(None, description="User ID (Cognito sub)")
    created_at: datetime
    updated_at: datetime
