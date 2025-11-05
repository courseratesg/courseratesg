"""Professor endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.v1.depends.storage import get_data_store, get_professor_storage
from app.schemas.professor import Professor
from app.schemas.review import Review
from app.storage.data_store import DataStore
from app.storage.professor_storage import ProfessorStorage

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
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Get a specific professor by ID.

    Args:
        professor_id: Professor ID
        data_store: Data store dependency

    Returns:
        Professor details

    Raises:
        HTTPException: If professor not found
    """
    professor = data_store.get_professor(professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor with ID {professor_id} not found")
    return professor


@router.get("/{professor_id}/reviews", response_model=list[Review])
def get_professor_reviews(
    professor_id: Annotated[int, Path(description="Professor ID")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Get reviews for a specific professor.

    Args:
        professor_id: Professor ID
        data_store: Data store dependency
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of reviews for the professor

    Raises:
        HTTPException: If professor not found
    """
    # Check if professor exists
    professor = data_store.get_professor(professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor with ID {professor_id} not found")

    # Get all reviews and filter by professor name
    all_reviews = data_store.get_all_reviews()
    professor_reviews = [
        review
        for review in all_reviews
        if review.professor_name and review.professor_name.lower() == professor.name.lower()
    ]

    # Apply pagination
    paginated_reviews = professor_reviews[skip : skip + limit]
    return paginated_reviews


@router.get("/{professor_id}/stats")
def get_professor_stats(
    professor_id: Annotated[int, Path(description="Professor ID")],
    data_store: Annotated[DataStore, Depends(get_data_store)],
) -> Any:
    """
    Get statistics for a specific professor.

    Args:
        professor_id: Professor ID
        data_store: Data store dependency

    Returns:
        Professor statistics including average ratings and review count

    Raises:
        HTTPException: If professor not found
    """
    # Check if professor exists
    professor = data_store.get_professor(professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Professor with ID {professor_id} not found")

    # Get all reviews for this professor
    all_reviews = data_store.get_all_reviews()
    professor_reviews = [
        review
        for review in all_reviews
        if review.professor_name and review.professor_name.lower() == professor.name.lower()
    ]

    if not professor_reviews:
        return {
            "professor_id": professor_id,
            "professor_name": professor.name,
            "university": professor.university,
            "total_reviews": 0,
            "average_overall_rating": None,
            "average_difficulty_rating": None,
            "average_workload_rating": None,
            "rating_distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0},
        }

    # Calculate statistics
    total_reviews = len(professor_reviews)
    avg_overall = sum(r.overall_rating for r in professor_reviews) / total_reviews
    avg_difficulty = sum(r.difficulty_rating for r in professor_reviews) / total_reviews
    avg_workload = sum(r.workload_rating for r in professor_reviews) / total_reviews

    # Calculate rating distribution
    rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for review in professor_reviews:
        rating_key = str(int(review.overall_rating))
        if rating_key in rating_distribution:
            rating_distribution[rating_key] += 1

    return {
        "professor_id": professor_id,
        "professor_name": professor.name,
        "university": professor.university,
        "total_reviews": total_reviews,
        "average_overall_rating": round(avg_overall, 2),
        "average_difficulty_rating": round(avg_difficulty, 2),
        "average_workload_rating": round(avg_workload, 2),
        "rating_distribution": rating_distribution,
    }
