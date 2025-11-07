"""Professor endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.v1.depends.storage import get_professor_storage, get_review_storage
from app.schemas.professor import Professor
from app.schemas.review import Review
from app.storage.professor_storage import ProfessorStorage
from app.storage.review_storage import ReviewStorage

router = APIRouter(prefix="/professors", tags=["professors"])

# TODO: create professor for admin


@router.get("/", response_model=list[Professor])
def list_professors(
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
    name: Annotated[str | None, Query(description="Filter by professor name (case-insensitive partial match)")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    List all professors with optional name filtering.

    Returns professors extracted from reviews with their review counts.

    Args:
        name: Filter by professor name (partial match)
        skip: Number of records to skip
        limit: Maximum number of records to return
        professor_storage: Professor storage dependency

    Returns:
        List of professors with review counts
    """
    professors = professor_storage.list_professors(
        name=name,
        skip=skip,
        limit=limit,
    )
    return professors


@router.get("/{professor_id}", response_model=Professor)
def get_professor(
    professor_id: Annotated[int, Path(description="Professor ID")],
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
) -> Any:
    """
    Get a specific professor by ID.

    Args:
        professor_id: Professor ID
        professor_storage: Professor storage dependency

    Returns:
        Professor details

    Raises:
        HTTPException: If professor not found
    """
    professor = professor_storage.get(professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor with ID {professor_id} not found")
    return professor


@router.get("/{professor_id}/reviews", response_model=list[Review])
def get_professor_reviews(
    professor_id: Annotated[int, Path(description="Professor ID")],
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Get reviews for a specific professor.

    Args:
        professor_id: Professor ID
        professor_storage: Professor storage dependency
        review_storage: Review storage dependency
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of reviews for the professor

    Raises:
        HTTPException: If professor not found
    """
    # Check if professor exists
    professor = professor_storage.get(professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor with ID {professor_id} not found")

    # Get reviews filtered by professor name
    reviews = review_storage.filter_reviews(professor_name=professor.name, skip=skip, limit=limit)
    return reviews


@router.get("/{professor_id}/stats")
def get_professor_stats(
    professor_id: Annotated[int, Path(description="Professor ID")],
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
) -> Any:
    """
    Get statistics for a specific professor.

    Args:
        professor_id: Professor ID
        professor_storage: Professor storage dependency
        review_storage: Review storage dependency

    Returns:
        Professor statistics including average ratings and review count

    Raises:
        HTTPException: If professor not found
    """
    # Check if professor exists
    professor = professor_storage.get(professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor with ID {professor_id} not found")

    # Get statistics using database aggregation
    stats = review_storage.get_stats(professor_name=professor.name)

    # Get reviews for rating distribution
    reviews = review_storage.filter_reviews(professor_name=professor.name, skip=0, limit=10000)

    # Calculate rating distribution
    rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for review in reviews:
        rating_key = str(int(review.overall_rating))
        if rating_key in rating_distribution:
            rating_distribution[rating_key] += 1

    return {
        "professor_id": professor_id,
        "professor_name": professor.name,
        "university": professor.university,
        "total_reviews": stats["review_count"],
        "average_overall_rating": round(stats["avg_overall_rating"], 2) if stats["avg_overall_rating"] else None,
        "average_difficulty_rating": (
            round(stats["avg_difficulty_rating"], 2) if stats["avg_difficulty_rating"] else None
        ),
        "average_workload_rating": round(stats["avg_workload_rating"], 2) if stats["avg_workload_rating"] else None,
        "rating_distribution": rating_distribution,
    }
