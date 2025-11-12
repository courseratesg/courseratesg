"""Database storage for universities."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.university import University as UniversityModel
from app.schemas.university import University


class UniversityStorage:
    """Database storage for universities."""

    def __init__(self, session: Session):
        """
        Initialize storage with database session.

        Args:
            session: SQLAlchemy database session
        """
        self._session = session

    def list_universities(
        self,
        *,
        name: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[University]:
        """
        List universities with optional name filtering.

        Args:
            name: Filter by university name (case-insensitive partial match)
            skip: Number of universities to skip
            limit: Maximum number of universities to return

        Returns:
            List of universities with review counts
        """
        stmt = select(UniversityModel)

        # Filter by name if provided (case-insensitive partial match)
        if name:
            stmt = stmt.where(func.lower(UniversityModel.name).contains(name.lower()))

        # Sort by name for consistency
        stmt = stmt.order_by(UniversityModel.name).offset(skip).limit(limit)

        db_universities = self._session.scalars(stmt).all()

        return [University.model_validate(u) for u in db_universities]
