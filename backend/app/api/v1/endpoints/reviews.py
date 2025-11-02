"""Review endpoints."""

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.v1.depends.storage import get_review_storage
from app.schemas import review as review_schema
from app.storage.review_storage import ReviewStorage

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=review_schema.Review, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: review_schema.ReviewCreate,
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
) -> Any:
    """
    Create a new review.

    Args:
        review_in: Review creation data
        review_storage: Review storage dependency

    Returns:
        Created review
    """
    review = review_storage.create(review_in)
    return review


@router.get("/me", response_model=list[review_schema.Review])
def get_my_reviews(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Get current user's reviews.

    Reserved for auth branch - returns empty list for now.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of user's reviews (empty for now)
    """
    # TODO: Implement user-specific review retrieval when authentication is added
    return []


# TODO: fuzzy search
@router.get("/stats")
def get_review_stats(
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    professor_name: Annotated[Optional[str], Query(description="Filter by professor name")] = None,
    course_code: Annotated[Optional[str], Query(description="Filter by course code")] = None,
    university: Annotated[Optional[str], Query(description="Filter by university")] = None,
) -> Any:
    """
    Get aggregated review statistics.

    Query parameters:
        - professor_name: Get stats for a specific professor
        - course_code + university: Get stats for a specific course at a university

    Args:
        professor_name: Professor name to filter by
        course_code: Course code to filter by
        university: University to filter by
        review_storage: Review storage dependency

    Returns:
        Dictionary with average ratings and review count
    """
    stats = review_storage.get_stats(
        professor_name=professor_name,
        course_code=course_code,
        university=university,
    )
    return stats


# TODO: fuzzy search
@router.get("/", response_model=list[review_schema.Review])
def list_reviews(
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    professor_name: Annotated[Optional[str], Query(description="Filter by professor name")] = None,
    course_code: Annotated[Optional[str], Query(description="Filter by course code")] = None,
    university: Annotated[Optional[str], Query(description="Filter by university")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Retrieve reviews with optional filtering.

    Query parameters:
        - professor_name: Get reviews for a specific professor
        - course_code + university: Get reviews for a specific course at a university
        - No filters: Get all reviews

    Args:
        professor_name: Professor name to filter by
        course_code: Course code to filter by
        university: University to filter by
        skip: Number of records to skip
        limit: Maximum number of records to return
        review_storage: Review storage dependency

    Returns:
        List of reviews
    """
    if professor_name or course_code or university:
        reviews = review_storage.filter_reviews(
            professor_name=professor_name,
            course_code=course_code,
            university=university,
            skip=skip,
            limit=limit,
        )
    else:
        reviews = review_storage.get_all(skip=skip, limit=limit)
    return reviews


@router.get("/{review_id}", response_model=review_schema.Review)
def get_review(
    review_id: Annotated[int, Path(description="Review ID", gt=0)],
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
) -> Any:
    """
    Get a specific review by ID.

    Args:
        review_id: Review ID
        review_storage: Review storage dependency

    Returns:
        Review

    Raises:
        HTTPException: If review not found
    """
    review = review_storage.get(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return review


@router.put("/{review_id}", response_model=review_schema.Review)
def update_review(
    review_id: Annotated[int, Path(description="Review ID", gt=0)],
    review_in: review_schema.ReviewUpdate,
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
) -> Any:
    """
    Update a review.

    Args:
        review_id: Review ID
        review_in: Review update data
        review_storage: Review storage dependency

    Returns:
        Updated review

    Raises:
        HTTPException: If review not found
    """
    review = review_storage.update(review_id, review_in)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: Annotated[int, Path(description="Review ID", gt=0)],
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
) -> None:
    """
    Delete a review.

    Args:
        review_id: Review ID
        review_storage: Review storage dependency

    Raises:
        HTTPException: If review not found
    """
    deleted = review_storage.delete(review_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
