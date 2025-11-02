"""Course endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.v1.depends.storage import get_course_storage, get_data_store
from app.schemas.course import Course
from app.schemas.review import Review
from app.storage.course_storage import CourseStorage
from app.storage.data_store import DataStore

router = APIRouter(prefix="/courses", tags=["courses"])

# TODO: create course for admin


@router.get("/", response_model=list[Course])
def list_courses(
    course_storage: Annotated[CourseStorage, Depends(get_course_storage)],
    code: Annotated[
        str | None, 
        Query(description="Filter by course code (case-insensitive partial match)")
    ] = None,
    university: Annotated[
        str | None, 
        Query(description="Filter by university (case-insensitive exact match)")
    ] = None,
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


@router.get("/{course_id}", response_model=Course)
def get_course(
    course_id: Annotated[int, Path(description="Course ID")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Get a specific course by ID.

    Args:
        course_id: Course ID
        data_store: Data store dependency

    Returns:
        Course details

    Raises:
        HTTPException: If course not found
    """
    course = data_store.get_course(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )
    return course


@router.get("/{course_id}/reviews", response_model=list[Review])
def get_course_reviews(
    course_id: Annotated[int, Path(description="Course ID")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Get reviews for a specific course.

    Args:
        course_id: Course ID
        data_store: Data store dependency
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of reviews for the course

    Raises:
        HTTPException: If course not found
    """
    # Check if course exists
    course = data_store.get_course(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )

    # Get all reviews and filter by course code and university
    all_reviews = data_store.get_all_reviews()
    course_reviews = [
        review for review in all_reviews 
        if (review.course_code.lower() == course.code.lower() and 
            review.university.lower() == course.university.lower())
    ]
    
    # Apply pagination
    paginated_reviews = course_reviews[skip:skip + limit]
    return paginated_reviews


@router.get("/{course_id}/stats")
def get_course_stats(
    course_id: Annotated[int, Path(description="Course ID")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Get statistics for a specific course.

    Args:
        course_id: Course ID
        data_store: Data store dependency

    Returns:
        Course statistics including average ratings and review count

    Raises:
        HTTPException: If course not found
    """
    # Check if course exists
    course = data_store.get_course(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )

    # Get all reviews for this course
    all_reviews = data_store.get_all_reviews()
    course_reviews = [
        review for review in all_reviews 
        if (review.course_code.lower() == course.code.lower() and 
            review.university.lower() == course.university.lower())
    ]

    if not course_reviews:
        return {
            "course_id": course_id,
            "course_code": course.code,
            "course_name": course.code,  # Using code as name for now
            "university": course.university,
            "total_reviews": 0,
            "average_overall_rating": None,
            "average_difficulty_rating": None,
            "average_workload_rating": None,
            "rating_distribution": {
                "5": 0, "4": 0, "3": 0, "2": 0, "1": 0
            },
            "professors": []
        }

    # Calculate statistics
    total_reviews = len(course_reviews)
    avg_overall = sum(r.overall_rating for r in course_reviews) / total_reviews
    avg_difficulty = sum(r.difficulty_rating for r in course_reviews) / total_reviews
    avg_workload = sum(r.workload_rating for r in course_reviews) / total_reviews

    # Calculate rating distribution
    rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for review in course_reviews:
        rating_key = str(int(review.overall_rating))
        if rating_key in rating_distribution:
            rating_distribution[rating_key] += 1

    # Get unique professors who taught this course
    professors = list(set([
        review.professor_name for review in course_reviews 
        if review.professor_name
    ]))

    return {
        "course_id": course_id,
        "course_code": course.code,
        "course_name": course.code,  # Using code as name for now
        "university": course.university,
        "total_reviews": total_reviews,
        "average_overall_rating": round(avg_overall, 2),
        "average_difficulty_rating": round(avg_difficulty, 2),
        "average_workload_rating": round(avg_workload, 2),
        "rating_distribution": rating_distribution,
        "professors": sorted(professors)
    }


@router.get("/{course_id}/professors")
def get_course_professors(
    course_id: Annotated[int, Path(description="Course ID")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Get professors who have taught this course.

    Args:
        course_id: Course ID
        data_store: Data store dependency

    Returns:
        List of professors who taught this course

    Raises:
        HTTPException: If course not found
    """
    # Check if course exists
    course = data_store.get_course(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )

    # Get all reviews for this course
    all_reviews = data_store.get_all_reviews()
    course_reviews = [
        review for review in all_reviews 
        if (review.course_code.lower() == course.code.lower() and 
            review.university.lower() == course.university.lower())
    ]

    # Get unique professors and their basic info
    professor_names = set([
        review.professor_name for review in course_reviews 
        if review.professor_name
    ])

    professors_info = []
    all_professors = data_store.get_all_professors()
    
    for prof_name in professor_names:
        # Find the professor object
        professor = next((p for p in all_professors if p.name.lower() == prof_name.lower()), None)
        if professor:
            # Count reviews for this professor in this course
            prof_course_reviews = [
                r for r in course_reviews 
                if r.professor_name and r.professor_name.lower() == prof_name.lower()
            ]
            
            avg_rating = (
                sum(r.overall_rating for r in prof_course_reviews) / len(prof_course_reviews) 
                if prof_course_reviews else 0
            )
            
            professors_info.append({
                "id": professor.id,
                "name": professor.name,
                "university": professor.university,
                "reviews_for_this_course": len(prof_course_reviews),
                "average_rating_for_this_course": round(avg_rating, 2) if prof_course_reviews else None
            })

    return {"data": sorted(professors_info, key=lambda x: x["name"])}
