"""In-memory storage for reviews."""

from datetime import datetime
from typing import Optional

from app.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.storage.data_store import DataStore


class ReviewStorage:
    """Simple in-memory storage for reviews."""

    """ Later to be replaced with persistent AWS RDS storage. """

    def __init__(self, data_store: DataStore):
        """
        Initialize storage.

        Args:
            data_store: DataStore instance for data access
        """
        self._data_store = data_store

    def create(self, review_in: ReviewCreate) -> Review:
        """
        Create a new review.

        Args:
            review_in: Review creation data

        Returns:
            Created review
        """
        return self._data_store.create_review(review_in)

    def get(self, review_id: int) -> Optional[Review]:
        """
        Get a review by ID.

        Args:
            review_id: Review ID

        Returns:
            Review or None if not found
        """
        return self._data_store.get_review(review_id)

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Review]:
        """
        Get all reviews with pagination.

        Args:
            skip: Number of reviews to skip
            limit: Maximum number of reviews to return

        Returns:
            List of reviews
        """
        all_reviews = self._data_store.get_all_reviews()
        return all_reviews[skip : skip + limit]

    def update(self, review_id: int, review_in: ReviewUpdate) -> Optional[Review]:
        """
        Update a review.

        Args:
            review_id: Review ID
            review_in: Review update data

        Returns:
            Updated review or None if not found
        """
        return self._data_store.update_review(review_id, review_in)

    def delete(self, review_id: int) -> bool:
        """
        Delete a review.

        Args:
            review_id: Review ID

        Returns:
            True if deleted, False if not found
        """
        return self._data_store.delete_review(review_id)

    def filter_reviews(
        self,
        *,
        professor_name: Optional[str] = None,
        course_code: Optional[str] = None,
        university: Optional[str] = None,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Review]:
        """
        Filter reviews by various criteria.

        Args:
            professor_name: Professor name to filter by
            course_code: Course code to filter by
            university: University name to filter by
            user_id: User ID to filter by (for "my reviews")
            skip: Number of reviews to skip
            limit: Maximum number of reviews to return

        Returns:
            List of filtered reviews
        """
        filtered = self._data_store.get_all_reviews()

        if professor_name:
            filtered = [r for r in filtered if r.professor_name and r.professor_name.lower() == professor_name.lower()]

        if course_code:
            filtered = [r for r in filtered if r.course_code.lower() == course_code.lower()]

        if university:
            filtered = [r for r in filtered if r.university.lower() == university.lower()]

        if user_id is not None:
            # For future auth support - mock for now
            filtered = []

        return filtered[skip : skip + limit]

    def get_stats(
        self,
        *,
        professor_name: Optional[str] = None,
        course_code: Optional[str] = None,
        university: Optional[str] = None,
    ) -> dict:
        """
        Get aggregated statistics for reviews matching criteria.

        Args:
            professor_name: Professor name to filter by
            course_code: Course code to filter by
            university: University name to filter by

        Returns:
            Dictionary with average ratings and count
        """
        filtered = self._data_store.get_all_reviews()

        if professor_name:
            filtered = [r for r in filtered if r.professor_name and r.professor_name.lower() == professor_name.lower()]

        if course_code:
            filtered = [r for r in filtered if r.course_code.lower() == course_code.lower()]

        if university:
            filtered = [r for r in filtered if r.university.lower() == university.lower()]

        if not filtered:
            return {
                "avg_overall_rating": None,
                "avg_difficulty_rating": None,
                "avg_workload_rating": None,
                "review_count": 0,
            }

        return {
            "avg_overall_rating": sum(r.overall_rating for r in filtered) / len(filtered),
            "avg_difficulty_rating": sum(r.difficulty_rating for r in filtered) / len(filtered),
            "avg_workload_rating": sum(r.workload_rating for r in filtered) / len(filtered),
            "review_count": len(filtered),
        }
