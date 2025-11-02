"""In-memory storage for reviews."""

from datetime import datetime

from app.schemas.review import Review, ReviewCreate, ReviewUpdate


class ReviewStorage:
    """Simple in-memory storage for reviews."""

    """ Later to be replaced with persistent AWS RDS storage. """

    def __init__(self):
        """Initialize storage."""
        self._reviews: dict[int, Review] = {}
        self._next_id: int = 1

    def create(self, review_in: ReviewCreate) -> Review:
        """
        Create a new review.

        Args:
            review_in: Review creation data

        Returns:
            Created review
        """
        review_data = review_in.model_dump()
        review_data["id"] = self._next_id
        review_data["created_at"] = datetime.utcnow()
        review_data["updated_at"] = datetime.utcnow()

        review = Review(**review_data)
        self._reviews[self._next_id] = review
        self._next_id += 1

        return review

    def get(self, review_id: int) -> Review | None:
        """
        Get a review by ID.

        Args:
            review_id: Review ID

        Returns:
            Review or None if not found
        """
        return self._reviews.get(review_id)

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Review]:
        """
        Get all reviews with pagination.

        Args:
            skip: Number of reviews to skip
            limit: Maximum number of reviews to return

        Returns:
            List of reviews
        """
        all_reviews = list(self._reviews.values())
        return all_reviews[skip : skip + limit]

    def update(self, review_id: int, review_in: ReviewUpdate) -> Review | None:
        """
        Update a review.

        Args:
            review_id: Review ID
            review_in: Review update data

        Returns:
            Updated review or None if not found
        """
        review = self._reviews.get(review_id)
        if not review:
            return None

        update_data = review_in.model_dump(exclude_unset=True)
        updated_fields = {**review.model_dump(), **update_data}
        updated_fields["updated_at"] = datetime.utcnow()

        updated_review = Review(**updated_fields)
        self._reviews[review_id] = updated_review

        return updated_review

    def delete(self, review_id: int) -> bool:
        """
        Delete a review.

        Args:
            review_id: Review ID

        Returns:
            True if deleted, False if not found
        """
        if review_id in self._reviews:
            del self._reviews[review_id]
            return True
        return False

    def filter_reviews(
        self,
        *,
        professor_name: str | None = None,
        course_code: str | None = None,
        university: str | None = None,
        user_id: int | None = None,
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
        filtered = list(self._reviews.values())

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
        professor_name: str | None = None,
        course_code: str | None = None,
        university: str | None = None,
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
        filtered = list(self._reviews.values())

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
