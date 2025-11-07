"""Search endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.depends.storage import (
    get_course_storage,
    get_professor_storage,
    get_review_storage,
    get_university_storage,
)
from app.storage.course_storage import CourseStorage
from app.storage.professor_storage import ProfessorStorage
from app.storage.review_storage import ReviewStorage
from app.storage.university_storage import UniversityStorage

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/professors")
def search_professors(
    q: Annotated[str, Query(description="Search query for professor name")],
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
) -> Any:
    """
    Search professors by name (fuzzy search).

    Supports partial name matching, case-insensitive.

    Args:
        q: Search query for professor name
        professor_storage: Professor storage dependency

    Returns:
        List of professor names that match the query
    """
    if not q.strip():
        return {"data": []}

    # Use list_professors with name filter (already supports partial match)
    professors = professor_storage.list_professors(name=q.strip(), skip=0, limit=100)

    # Extract and deduplicate names
    unique_names = sorted(list(set([p.name for p in professors])))
    return {"data": unique_names}


@router.get("/courses")
def search_courses(
    q: Annotated[str, Query(description="Search query for course code")],
    course_storage: Annotated[CourseStorage, Depends(get_course_storage)],
    exact: Annotated[bool, Query(description="Whether to use exact match (default: true)")] = True,
) -> Any:
    """
    Search courses by code.

    Supports both exact and partial matching, case-insensitive.

    Args:
        q: Search query for course code
        exact: Whether to use exact match (default: true)
        course_storage: Course storage dependency

    Returns:
        List of courses that match the query
    """
    if not q.strip():
        return {"data": []}

    # Use list_courses with code filter (already supports partial match)
    courses = course_storage.list_courses(code=q.strip(), skip=0, limit=100)

    # For exact match, filter results
    if exact:
        courses = [c for c in courses if c.code.lower() == q.strip().lower()]

    matching_courses = [
        {
            "code": course.code,
            "name": course.name if hasattr(course, "name") and course.name else course.code,
            "university": course.university,
        }
        for course in courses
    ]

    return {"data": matching_courses}


@router.get("/global")
def global_search(
    q: Annotated[str, Query(description="Global search query")],
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
    course_storage: Annotated[CourseStorage, Depends(get_course_storage)],
) -> Any:
    """
    Global search across professors and courses.

    Searches both professors (fuzzy) and courses (exact match).

    Args:
        q: Search query
        professor_storage: Professor storage dependency
        course_storage: Course storage dependency

    Returns:
        Dictionary with professors and courses results
    """
    if not q.strip():
        return {"data": {"professors": [], "courses": []}}

    # Search professors (fuzzy/partial match)
    professors = professor_storage.list_professors(name=q.strip(), skip=0, limit=100)
    matching_professors = [{"name": prof.name, "university": prof.university, "id": prof.id} for prof in professors]

    # Search courses (exact match)
    all_courses = course_storage.list_courses(code=q.strip(), skip=0, limit=100)
    exact_courses = [c for c in all_courses if c.code.lower() == q.strip().lower()]
    matching_courses = [
        {
            "code": course.code,
            "name": course.name if hasattr(course, "name") and course.name else course.code,
            "university": course.university,
            "id": course.id,
        }
        for course in exact_courses
    ]

    return {"data": {"professors": matching_professors, "courses": matching_courses}}


@router.get("/stats")
def search_stats(
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
    course_storage: Annotated[CourseStorage, Depends(get_course_storage)],
    university_storage: Annotated[UniversityStorage, Depends(get_university_storage)],
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
) -> Any:
    """
    Get search statistics.

    Returns total counts of professors, courses, universities, and reviews.

    Args:
        professor_storage: Professor storage dependency
        course_storage: Course storage dependency
        university_storage: University storage dependency
        review_storage: Review storage dependency

    Returns:
        Dictionary with search statistics
    """
    # Get counts by fetching all records (pagination with large limit)
    # TODO: Optimize with dedicated count queries in storage layer
    professors = professor_storage.list_professors(skip=0, limit=10000)
    courses = course_storage.list_courses(skip=0, limit=10000)
    universities = university_storage.list_universities(skip=0, limit=10000)
    reviews = review_storage.get_all(skip=0, limit=10000)

    # Calculate stats by university
    professors_by_uni = {}
    courses_by_uni = {}
    for uni in universities:
        professors_by_uni[uni.name] = len([p for p in professors if p.university == uni.name])
        courses_by_uni[uni.name] = len([c for c in courses if c.university == uni.name])

    return {
        "data": {
            "total_professors": len(professors),
            "total_courses": len(courses),
            "total_universities": len(universities),
            "total_reviews": len(reviews),
            "professors_by_university": professors_by_uni,
            "courses_by_university": courses_by_uni,
        }
    }
