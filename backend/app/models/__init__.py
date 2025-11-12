"""Database models package."""

from app.models.base import Base
from app.models.course import Course
from app.models.professor import Professor
from app.models.review import Review
from app.models.university import University

__all__ = [
    "Base",
    "University",
    "Professor",
    "Course",
    "Review",
]
