"""Review endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.v1.depends.auth import get_current_user
from app.api.v1.depends.storage import (
    get_course_storage,
    get_review_storage,
    get_university_storage,
)
from app.schemas import review as review_schema
from app.storage.course_storage import CourseStorage
from app.storage.review_storage import ReviewStorage
from app.storage.university_storage import UniversityStorage

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=review_schema.Review, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: review_schema.ReviewCreate,
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    course_storage: Annotated[CourseStorage, Depends(get_course_storage)],
    university_storage: Annotated[UniversityStorage, Depends(get_university_storage)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> Any:
    """
    Create a new review (requires authentication).

    Args:
        review_in: Review creation data
        review_storage: Review storage dependency
        course_storage: Course storage dependency
        university_storage: University storage dependency
        current_user: Current authenticated user

    Returns:
        Created review
    """
    # HACK: Auto-create course and university if they don't exist
    university = university_storage.get_or_create(name=review_in.university)

    # Use provided course_name if available, otherwise fallback to course_code
    course_name = review_in.course_name if review_in.course_name else review_in.course_code

    course_storage.get_or_create(
        code=review_in.course_code,
        name=course_name,
        university_id=university.id,
        university_name=university.name,
    )

    # Create review with user_id from authenticated user
    review = review_storage.create(review_in, user_id=current_user["user_id"])
    return review


@router.get("/me", response_model=list[review_schema.Review])
def get_my_reviews(
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    current_user: Annotated[dict, Depends(get_current_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Get current user's reviews (requires authentication).

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        review_storage: Review storage dependency
        current_user: Current authenticated user

    Returns:
        List of user's reviews
    """
    reviews = review_storage.filter_reviews(
        user_id=current_user["user_id"],
        skip=skip,
        limit=limit,
    )
    return reviews


# TODO: fuzzy search
@router.get("/stats")
def get_review_stats(
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    professor_name: Annotated[str | None, Query(description="Filter by professor name")] = None,
    course_code: Annotated[str | None, Query(description="Filter by course code")] = None,
    university: Annotated[str | None, Query(description="Filter by university")] = None,
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
    professor_name: Annotated[str | None, Query(description="Filter by professor name")] = None,
    course_code: Annotated[str | None, Query(description="Filter by course code")] = None,
    university: Annotated[str | None, Query(description="Filter by university")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    Retrieve reviews with optional filtering (no authentication required).

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
    current_user: Annotated[dict, Depends(get_current_user)],
) -> Any:
    """
    Update a review (requires authentication, only owner can update).

    Args:
        review_id: Review ID
        review_in: Review update data
        review_storage: Review storage dependency
        current_user: Current authenticated user

    Returns:
        Updated review

    Raises:
        HTTPException: If review not found or user is not the owner
    """
    # Check if review exists
    review = review_storage.get(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    # Check ownership
    if review.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews",
        )

    # Update review
    updated_review = review_storage.update(review_id, review_in)
    return updated_review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: Annotated[int, Path(description="Review ID", gt=0)],
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> None:
    """
    Delete a review (requires authentication, only owner can delete).

    Args:
        review_id: Review ID
        review_storage: Review storage dependency
        current_user: Current authenticated user

    Raises:
        HTTPException: If review not found or user is not the owner
    """
    # Check if review exists
    review = review_storage.get(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    # Check ownership
    if review.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews",
        )

    # Delete review
    review_storage.delete(review_id)
