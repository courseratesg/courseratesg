from functools import lru_cache

from app.storage.course_storage import CourseStorage
from app.storage.data_store import DataStore
from app.storage.professor_storage import ProfessorStorage
from app.storage.review_storage import ReviewStorage
from app.storage.university_storage import UniversityStorage


@lru_cache(maxsize=1)
def get_data_store() -> DataStore:
    """
    Get DataStore instance (singleton).

    This is the central data store that all storage classes use.
    Similar to a database session in real applications.
    """
    return DataStore()


# TODO: refactor to dependency injection to get data_store


@lru_cache(maxsize=1)
def get_review_storage() -> ReviewStorage:
    """Get ReviewStorage instance (singleton)."""
    return ReviewStorage(data_store=get_data_store())


@lru_cache(maxsize=1)
def get_professor_storage() -> ProfessorStorage:
    """Get ProfessorStorage instance (singleton)."""
    return ProfessorStorage(data_store=get_data_store())


@lru_cache(maxsize=1)
def get_course_storage() -> CourseStorage:
    """Get CourseStorage instance (singleton)."""
    return CourseStorage(data_store=get_data_store())


@lru_cache(maxsize=1)
def get_university_storage() -> UniversityStorage:
    """Get UniversityStorage instance (singleton)."""
    return UniversityStorage(data_store=get_data_store())
