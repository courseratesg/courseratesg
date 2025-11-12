"""Database storage for professors."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.professor import Professor as ProfessorModel
from app.schemas.professor import Professor


class ProfessorStorage:
    """Database storage for professors."""

    def __init__(self, session: Session):
        """
        Initialize storage with database session.

        Args:
            session: SQLAlchemy database session
        """
        self._session = session

    def get(self, professor_id: int) -> Professor | None:
        """
        Get a professor by ID.

        Args:
            professor_id: Professor ID

        Returns:
            Professor or None if not found
        """
        stmt = select(ProfessorModel).where(ProfessorModel.id == professor_id)
        db_professor = self._session.scalar(stmt)

        if db_professor is None:
            return None

        return Professor.model_validate(db_professor)

    def list_professors(
        self,
        *,
        name: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Professor]:
        """
        List professors with optional name filtering.

        Args:
            name: Filter by professor name (case-insensitive partial match)
            skip: Number of professors to skip
            limit: Maximum number of professors to return

        Returns:
            List of professors with review counts and university names
        """
        stmt = select(ProfessorModel)

        # Filter by name if provided (case-insensitive partial match)
        if name:
            stmt = stmt.where(func.lower(ProfessorModel.name).contains(name.lower()))

        # Sort by name for consistency
        stmt = stmt.order_by(ProfessorModel.name).offset(skip).limit(limit)

        db_professors = self._session.scalars(stmt).all()

        return [Professor.model_validate(p) for p in db_professors]
