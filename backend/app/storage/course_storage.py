"""Course storage implementation."""

from typing import Optional

from app.schemas.course import Course
from app.storage.data_store import DataStore


class CourseStorage:
    """Storage for course data extracted from reviews."""

    def __init__(self, data_store: DataStore):
        """
        Initialize storage.

        Args:
            data_store: DataStore instance for data access
        """
        self._data_store = data_store

    def list_courses(
        self,
        *,
        code: Optional[str] = None,
        university: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Course]:
        """
        List courses with optional filtering.

        Args:
            code: Filter by course code (case-insensitive partial match)
            university: Filter by university name (case-insensitive exact match)
            skip: Number of courses to skip
            limit: Maximum number of courses to return

        Returns:
            List of courses with review counts and university names
        """
        # Get all courses from data store
        courses = self._data_store.get_all_courses()

        # Get all universities to resolve names
        universities = {u.id: u.name for u in self._data_store.get_all_universities()}

        # Build course response objects with university names
        course_responses = []
        for course in courses:
            university_name = universities.get(course.university_id, "Unknown")
            # Create Course response object
            course_response = Course(
                id=course.id,
                code=course.code,
                university_id=course.university_id,
                university=university_name,
                review_count=course.review_count,
            )
            course_responses.append(course_response)

        # Filter by code if provided (case-insensitive partial match)
        if code:
            course_responses = [c for c in course_responses if code.lower() in c.code.lower()]

        # Filter by university if provided (case-insensitive exact match)
        if university:
            course_responses = [c for c in course_responses if c.university.lower() == university.lower()]

        # Sort by university then code for consistency
        course_responses.sort(key=lambda c: (c.university.lower(), c.code.lower()))

        # Apply pagination
        return course_responses[skip : skip + limit]
