"""Review schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Valid semester values
SemesterType = Literal[
    "Semester 1",
    "Semester 2",
    "Special Term 1",
    "Special Term 2",
    "Summer Session",
    "Winter Session",
]


class ReviewBase(BaseModel):
    """Base review schema."""

    overall_rating: int = Field(..., ge=0, le=5, description="Overall rating (0-5)")
    difficulty_rating: int = Field(..., ge=0, le=5, description="Difficulty rating (0-5)")
    workload_rating: int = Field(..., ge=0, le=5, description="Workload rating (0-5)")
    comment: str | None = Field(None, max_length=5000, description="Review comment")
    semester: SemesterType = Field(..., description="Semester")
    year: int = Field(..., ge=2000, le=2100, description="Year")

    # For API-only branch: use names/codes instead of IDs
    course_code: str = Field(..., description="Course code (e.g., 'CS5224')")
    course_name: str | None = Field(
        None,
        description=(
            "Course name (e.g., 'Cloud Computing'). Optional when creating, will be populated from course table."
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

    overall_rating: int | None = Field(None, ge=0, le=5)
    difficulty_rating: int | None = Field(None, ge=0, le=5)
    workload_rating: int | None = Field(None, ge=0, le=5)
    comment: str | None = Field(None, max_length=5000)
    semester: SemesterType | None = None
    year: int | None = Field(None, ge=2000, le=2100)
    professor_name: str | None = None


class Review(ReviewBase):
    """Schema for review responses."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    user_id: str | None = Field(None, description="User ID (Cognito sub)")
    created_at: datetime
    updated_at: datetime
