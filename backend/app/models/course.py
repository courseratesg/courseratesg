"""Course database model."""

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Course(Base):
    """Course database model."""

    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    university_id: Mapped[int] = mapped_column(
        ForeignKey("universities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Denormalized university name for easier querying
    university: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    review_count: Mapped[int] = mapped_column(default=0, nullable=False)

    # Composite index on (university_id, code)
    __table_args__ = (Index("idx_course_university_code", "university_id", "code"),)

    def __repr__(self) -> str:
        """String representation of Course."""
        return f"<Course(id={self.id}, code='{self.code}', university='{self.university}')>"
