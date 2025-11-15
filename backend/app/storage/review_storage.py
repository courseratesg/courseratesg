"""Database storage for reviews."""

from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.review import Review as ReviewModel
from app.schemas.review import Review, ReviewCreate, ReviewUpdate


class ReviewStorage:
    """Database storage for reviews using SQLAlchemy."""

    def __init__(self, session: Session):
        """
        Initialize storage with database session.

        Args:
            session: SQLAlchemy database session
        """
        self._session = session

    @staticmethod
    def _get_semester_order():
        """
        Get semester sort order for descending sorting.

        Semester order (ascending):
        1. Semester 1
        2. Special Term 1
        3. Winter Session
        4. Semester 2
        5. Special Term 2
        6. Summer Session

        Returns descending order (6 to 1) for sorting.
        """
        return case(
            (ReviewModel.semester == "Summer Session", 6),
            (ReviewModel.semester == "Special Term 2", 5),
            (ReviewModel.semester == "Semester 2", 4),
            (ReviewModel.semester == "Winter Session", 3),
            (ReviewModel.semester == "Special Term 1", 2),
            (ReviewModel.semester == "Semester 1", 1),
            else_=0,  # Unknown semesters sort to the end
        )

    def create(self, review_in: ReviewCreate, user_id: str | None = None, course_name: str | None = None) -> Review:
        """
        Create a new review.

        Args:
            review_in: Review creation data
            user_id: User ID (Cognito sub)
            course_name: Course name (overrides review_in.course_name if provided)

        Returns:
            Created review
        """
        # Use provided course_name or fall back to review_in.course_name
        final_course_name = course_name if course_name is not None else review_in.course_name

        # Convert schema to model
        db_review = ReviewModel(
            user_id=user_id,
            overall_rating=review_in.overall_rating,
            difficulty_rating=review_in.difficulty_rating,
            workload_rating=review_in.workload_rating,
            comment=review_in.comment,
            semester=review_in.semester,
            year=review_in.year,
            course_code=review_in.course_code,
            course_name=final_course_name or review_in.course_code,  # Fall back to course_code
            university_name=review_in.university,
            professor_name=review_in.professor_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self._session.add(db_review)
        self._session.flush()  # Get ID without committing
        self._session.refresh(db_review)

        # Convert model back to schema
        return Review.model_validate(db_review)

    def get(self, review_id: int) -> Review | None:
        """
        Get a review by ID.

        Args:
            review_id: Review ID

        Returns:
            Review or None if not found
        """
        stmt = select(ReviewModel).where(ReviewModel.id == review_id)
        db_review = self._session.scalar(stmt)

        if db_review is None:
            return None

        return Review.model_validate(db_review)

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Review]:
        """
        Get all reviews with pagination.

        Args:
            skip: Number of reviews to skip
            limit: Maximum number of reviews to return

        Returns:
            List of reviews ordered by year (desc), semester (desc), created_at (desc)
        """
        stmt = (
            select(ReviewModel)
            .order_by(
                ReviewModel.year.desc(),
                self._get_semester_order().desc(),
                ReviewModel.created_at.desc(),
            )
            .offset(skip)
            .limit(limit)
        )
        db_reviews = self._session.scalars(stmt).all()

        return [Review.model_validate(r) for r in db_reviews]

    def update(self, review_id: int, review_in: ReviewUpdate) -> Review | None:
        """
        Update a review.

        Args:
            review_id: Review ID
            review_in: Review update data

        Returns:
            Updated review or None if not found
        """
        stmt = select(ReviewModel).where(ReviewModel.id == review_id)
        db_review = self._session.scalar(stmt)

        if db_review is None:
            return None

        # Update only provided fields
        update_data = review_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_review, field, value)

        db_review.updated_at = datetime.utcnow()

        self._session.flush()
        self._session.refresh(db_review)

        return Review.model_validate(db_review)

    def delete(self, review_id: int) -> bool:
        """
        Delete a review.

        Args:
            review_id: Review ID

        Returns:
            True if deleted, False if not found
        """
        stmt = select(ReviewModel).where(ReviewModel.id == review_id)
        db_review = self._session.scalar(stmt)

        if db_review is None:
            return False

        self._session.delete(db_review)
        self._session.flush()

        return True

    def filter_reviews(
        self,
        *,
        professor_name: str | None = None,
        course_code: str | None = None,
        university: str | None = None,
        user_id: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Review]:
        """
        Filter reviews by various criteria with pagination support.

        Args:
            professor_name: Professor name to filter by (case-insensitive)
            course_code: Course code to filter by (case-insensitive)
            university: University name to filter by (case-insensitive)
            user_id: User ID (Cognito sub) to filter by (for "my reviews")
            skip: Number of reviews to skip (pagination)
            limit: Maximum number of reviews to return (pagination)

        Returns:
            List of filtered reviews ordered by year (desc), semester (desc), created_at (desc)
        """
        stmt = select(ReviewModel)

        # Apply filters
        if professor_name:
            stmt = stmt.where(func.lower(ReviewModel.professor_name) == professor_name.lower())

        if course_code:
            stmt = stmt.where(func.lower(ReviewModel.course_code) == course_code.lower())

        if university:
            stmt = stmt.where(func.lower(ReviewModel.university_name) == university.lower())

        if user_id is not None:
            # Filter by user_id (Cognito sub) for "my reviews"
            stmt = stmt.where(ReviewModel.user_id == user_id)

        # Order by year (desc), semester (desc), created_at (desc)
        stmt = (
            stmt.order_by(
                ReviewModel.year.desc(),
                self._get_semester_order().desc(),
                ReviewModel.created_at.desc(),
            )
            .offset(skip)
            .limit(limit)
        )

        db_reviews = self._session.scalars(stmt).all()

        return [Review.model_validate(r) for r in db_reviews]

    def get_stats(
        self,
        *,
        professor_name: str | None = None,
        course_code: str | None = None,
        university: str | None = None,
    ) -> dict:
        """
        Get aggregated statistics for reviews matching criteria.

        Uses database aggregation for efficiency.

        Args:
            professor_name: Professor name to filter by
            course_code: Course code to filter by
            university: University name to filter by

        Returns:
            Dictionary with average ratings and count
        """
        # Build query with filters
        stmt = select(
            func.avg(ReviewModel.overall_rating).label("avg_overall"),
            func.avg(ReviewModel.difficulty_rating).label("avg_difficulty"),
            func.avg(ReviewModel.workload_rating).label("avg_workload"),
            func.count(ReviewModel.id).label("count"),
        )

        # Apply filters
        if professor_name:
            stmt = stmt.where(func.lower(ReviewModel.professor_name) == professor_name.lower())

        if course_code:
            stmt = stmt.where(func.lower(ReviewModel.course_code) == course_code.lower())

        if university:
            stmt = stmt.where(func.lower(ReviewModel.university_name) == university.lower())

        result = self._session.execute(stmt).one()

        return {
            "avg_overall_rating": float(result.avg_overall) if result.avg_overall else None,
            "avg_difficulty_rating": float(result.avg_difficulty) if result.avg_difficulty else None,
            "avg_workload_rating": float(result.avg_workload) if result.avg_workload else None,
            "review_count": result.count,
        }
