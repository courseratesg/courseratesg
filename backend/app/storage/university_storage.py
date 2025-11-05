"""In-memory storage for universities."""

from app.schemas.university import University
from app.storage.data_store import DataStore


class UniversityStorage:
    """Storage for university data extracted from reviews."""

    def __init__(self, data_store: DataStore):
        """
        Initialize storage.

        Args:
            data_store: DataStore instance for data access
        """
        self._data_store = data_store

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
        # Get all universities from data store
        universities = self._data_store.get_all_universities()

        # Filter by name if provided (case-insensitive partial match)
        if name:
            universities = [u for u in universities if name.lower() in u.name.lower()]

        # Sort by name for consistency
        universities.sort(key=lambda u: u.name.lower())

        # Apply pagination
        return universities[skip : skip + limit]
