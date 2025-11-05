"""Professor storage implementation."""

from app.schemas.professor import Professor
from app.storage.data_store import DataStore


class ProfessorStorage:
    """Storage for professor data extracted from reviews."""

    def __init__(self, data_store: DataStore):
        """
        Initialize storage.

        Args:
            data_store: DataStore instance for data access
        """
        self._data_store = data_store

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
        # Get all professors from data store
        professors = self._data_store.get_all_professors()

        # Get all universities to resolve names
        universities = {u.id: u.name for u in self._data_store.get_all_universities()}

        # Build professor response objects with university names
        professor_responses = []
        for professor in professors:
            university_name = universities.get(professor.university_id, "Unknown")
            # Create Professor response object
            professor_response = Professor(
                id=professor.id,
                name=professor.name,
                university_id=professor.university_id,
                university=university_name,
                review_count=professor.review_count,
            )
            professor_responses.append(professor_response)

        # Filter by name if provided (case-insensitive partial match)
        if name:
            professor_responses = [p for p in professor_responses if name.lower() in p.name.lower()]

        # Sort by name for consistency
        professor_responses.sort(key=lambda p: p.name.lower())

        # Apply pagination
        return professor_responses[skip : skip + limit]
