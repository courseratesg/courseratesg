"""Professor database model."""

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Professor(Base):
    """Professor database model."""

    __tablename__ = "professors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    university_id: Mapped[int] = mapped_column(
        ForeignKey("universities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Denormalized university name for easier querying
    university: Mapped[str] = mapped_column(String(255), nullable=False)
    review_count: Mapped[int] = mapped_column(default=0, nullable=False)

    def __repr__(self) -> str:
        """String representation of Professor."""
        return f"<Professor(id={self.id}, name='{self.name}', university='{self.university}')>"
