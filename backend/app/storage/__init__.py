"""In-memory storage package."""

from app.storage.course_storage import CourseStorage
from app.storage.professor_storage import ProfessorStorage
from app.storage.review_storage import ReviewStorage
from app.storage.university_storage import UniversityStorage

__all__ = [
    "CourseStorage",
    "ProfessorStorage",
    "ReviewStorage",
    "UniversityStorage",
]
