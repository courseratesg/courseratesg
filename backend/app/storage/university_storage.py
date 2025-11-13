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

    def get_by_name(self, name: str) -> University | None:
        """
        Get a university by exact name (case-insensitive).

        Args:
            name: University name

        Returns:
            University or None if not found
        """
        stmt = select(UniversityModel).where(func.lower(UniversityModel.name) == name.lower())
        db_university = self._session.scalar(stmt)

        if db_university is None:
            return None

        return University.model_validate(db_university)

    def create(self, name: str) -> University:
        """
        Create a new university.

        Args:
            name: University name

        Returns:
            Created university
        """
        db_university = UniversityModel(
            name=name,
            review_count=0,
        )

        self._session.add(db_university)
        self._session.flush()
        self._session.refresh(db_university)

        return University.model_validate(db_university)

    def get_or_create(self, name: str) -> University:
        """
        Get a university by name, or create it if it doesn't exist.

        Args:
            name: University name

        Returns:
            Existing or newly created university
        """
        university = self.get_by_name(name)
        if university:
            return university
        return self.create(name)

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
