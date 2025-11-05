"""Search endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.depends.storage import get_data_store
from app.storage.data_store import DataStore

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/professors")
def search_professors(
    q: Annotated[str, Query(description="Search query for professor name")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Search professors by name (fuzzy search).

    Supports partial name matching, case-insensitive.

    Args:
        q: Search query for professor name
        data_store: Data store dependency

    Returns:
        List of professor names that match the query
    """
    if not q.strip():
        return {"data": []}

    query_lower = q.lower().strip()
    professors = data_store.get_all_professors()

    # Fuzzy search: check if query is contained in professor name
    matching_professors = []
    for professor in professors:
        if query_lower in professor.name.lower():
            matching_professors.append(professor.name)

    # Remove duplicates and sort
    unique_names = sorted(list(set(matching_professors)))
    return {"data": unique_names}


@router.get("/courses")
def search_courses(
    q: Annotated[str, Query(description="Search query for course code")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
    exact: Annotated[bool, Query(description="Whether to use exact match (default: true)")] = True,
) -> Any:
    """
    Search courses by code.

    Supports both exact and partial matching, case-insensitive.

    Args:
        q: Search query for course code
        exact: Whether to use exact match (default: true)
        data_store: Data store dependency

    Returns:
        List of courses that match the query
    """
    if not q.strip():
        return {"data": []}

    query_upper = q.upper().strip()
    courses = data_store.get_all_courses()

    matching_courses = []
    for course in courses:
        course_code_upper = course.code.upper()

        # Choose matching strategy based on exact parameter
        if exact:
            # Exact match
            if course_code_upper == query_upper:
                matching_courses.append(
                    {
                        "code": course.code,
                        "name": course.code,  # Using code as name for now
                        "university": course.university,
                    }
                )
        else:
            # Partial match
            if query_upper in course_code_upper:
                matching_courses.append(
                    {
                        "code": course.code,
                        "name": course.code,  # Using code as name for now
                        "university": course.university,
                    }
                )

    return {"data": matching_courses}


@router.get("/global")
def global_search(
    q: Annotated[str, Query(description="Global search query")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Global search across professors and courses.

    Searches both professors (fuzzy) and courses (exact match).

    Args:
        q: Search query
        data_store: Data store dependency

    Returns:
        Dictionary with professors and courses results
    """
    if not q.strip():
        return {"data": {"professors": [], "courses": []}}

    # Search professors (fuzzy)
    query_lower = q.lower().strip()
    professors = data_store.get_all_professors()
    matching_professors = []
    for professor in professors:
        if query_lower in professor.name.lower():
            matching_professors.append({"name": professor.name, "university": professor.university, "id": professor.id})

    # Search courses (exact match)
    query_upper = q.upper().strip()
    courses = data_store.get_all_courses()
    matching_courses = []
    for course in courses:
        if course.code.upper() == query_upper:
            matching_courses.append(
                {"code": course.code, "name": course.code, "university": course.university, "id": course.id}
            )

    return {"data": {"professors": matching_professors, "courses": matching_courses}}


@router.get("/stats")
def search_stats(
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Get search statistics.

    Returns total counts of professors, courses, universities, and reviews.

    Args:
        data_store: Data store dependency

    Returns:
        Dictionary with search statistics
    """
    professors = data_store.get_all_professors()
    courses = data_store.get_all_courses()
    universities = data_store.get_all_universities()
    reviews = data_store.get_all_reviews()

    return {
        "data": {
            "total_professors": len(professors),
            "total_courses": len(courses),
            "total_universities": len(universities),
            "total_reviews": len(reviews),
            "professors_by_university": {
                uni.name: len([p for p in professors if p.university_id == uni.id]) for uni in universities
            },
            "courses_by_university": {
                uni.name: len([c for c in courses if c.university_id == uni.id]) for uni in universities
            },
        }
    }
