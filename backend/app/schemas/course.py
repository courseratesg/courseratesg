"""Course schemas."""

from pydantic import BaseModel, ConfigDict, Field


class CourseBase(BaseModel):
    """Base course schema with shared fields."""

    code: str = Field(..., min_length=1, description="Course code")
    university_id: int = Field(..., description="University ID offering this course")


class CourseCreate(CourseBase):
    """Schema for creating a course."""

    pass


class Course(CourseBase):
    """Course response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Course ID")
    university: str = Field(..., description="University name offering this course")
    review_count: int = Field(..., ge=0, description="Number of reviews for this course")
