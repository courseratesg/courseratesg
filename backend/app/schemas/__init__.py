"""Pydantic schemas package."""

from app.schemas.course import Course
from app.schemas.professor import Professor
from app.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.schemas.university import University

__all__ = [
    "Course",
    "Professor",
    "Review",
    "ReviewCreate",
    "ReviewUpdate",
    "University",
]
