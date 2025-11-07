"""Review database model."""

from sqlalchemy import Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Review(Base, TimestampMixin):
    """Review database model with timestamps."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # User information (for incognito support)
    user_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # Rating fields
    overall_rating: Mapped[float] = mapped_column(Float, nullable=False)
    difficulty_rating: Mapped[float] = mapped_column(Float, nullable=False)
    workload_rating: Mapped[float] = mapped_column(Float, nullable=False)

    # Review content
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Semester information
    semester: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # Denormalized fields for easier querying (API-first design)
    # In a fully normalized design, these would be foreign keys
    course_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    university_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    professor_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # Composite indexes for common query patterns
    __table_args__ = (
        # Query reviews by university and course
        Index("idx_review_university_course", "university_name", "course_code"),
        # Query reviews by university and professor
        Index("idx_review_university_professor", "university_name", "professor_name"),
        # Query reviews by course and year
        Index("idx_review_course_year", "course_code", "year"),
        # Query latest reviews (descending order)
        Index("idx_review_created_at_desc", "created_at"),
        # Query user's own reviews (for "my reviews" feature)
        Index("idx_review_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        """String representation of Review."""
        return (
            f"<Review(id={self.id}, course='{self.course_code}', "
            f"university='{self.university_name}', rating={self.overall_rating})>"
        )
