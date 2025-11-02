"""Course endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.depends.storage import get_course_storage
from app.schemas.course import Course
from app.storage.course_storage import CourseStorage

router = APIRouter(prefix="/courses", tags=["courses"])

# TODO: create course for admin

@router.get("/", response_model=list[Course])
def list_courses(
    course_storage: Annotated[CourseStorage, Depends(get_course_storage)],
    code: Annotated[str | None, Query(description="Filter by course code (case-insensitive partial match)")] = None,
    university: Annotated[str | None, Query(description="Filter by university (case-insensitive exact match)")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    List all courses with optional filtering.

    Returns courses extracted from reviews with their review counts.
    A course is identified by the combination of course code and university.

    Args:
        code: Filter by course code (partial match)
        university: Filter by university (exact match)
        skip: Number of records to skip
        limit: Maximum number of records to return
        course_storage: Course storage dependency

    Returns:
        List of courses with review counts
    """
    courses = course_storage.list_courses(
        code=code,
        university=university,
        skip=skip,
        limit=limit,
    )
    return courses
