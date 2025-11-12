"""University database model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class University(Base):
    """University database model."""

    __tablename__ = "universities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    review_count: Mapped[int] = mapped_column(default=0, nullable=False)

    def __repr__(self) -> str:
        """String representation of University."""
        return f"<University(id={self.id}, name='{self.name}')>"
