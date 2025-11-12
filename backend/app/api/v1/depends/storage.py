"""Dependency injection for storage and database."""

from collections.abc import Generator
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy import exc
from sqlalchemy.orm import Session

from app.infrastructure.rds_client import RDSClient
from app.settings.rds_settings import RDSSettings
from app.storage.course_storage import CourseStorage
from app.storage.professor_storage import ProfessorStorage
from app.storage.review_storage import ReviewStorage
from app.storage.university_storage import UniversityStorage

# Database dependency injection functions


@lru_cache(maxsize=1)
def get_db_client() -> RDSClient:
    """
    FastAPI dependency for RDS client (singleton).

    Returns:
        RDS client instance

    Example:
        @app.get("/status")
        def get_status(client: Annotated[RDSClient, Depends(get_db_client)]):
            is_healthy = client.health_check()
            return {"database": "healthy" if is_healthy else "unhealthy"}
    """
    settings = RDSSettings()  # type: ignore[call-arg]
    client = RDSClient(settings)
    client.initialize()
    return client


def get_db_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.

    Yields:
        SQLAlchemy session

    Example:
        @app.get("/items")
        def get_items(db: Annotated[Session, Depends(get_db_session)]):
            return db.query(Item).all()
    """
    client = get_db_client()
    session = client.create_session()
    try:
        yield session
        session.commit()
    except exc.SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()


# Storage dependency injection using database sessions


def get_review_storage(
    session: Annotated[Session, Depends(get_db_session)],
) -> ReviewStorage:
    """
    Get ReviewStorage instance with database session.

    Args:
        session: Database session from dependency injection

    Returns:
        ReviewStorage instance
    """
    return ReviewStorage(session=session)


def get_professor_storage(
    session: Annotated[Session, Depends(get_db_session)],
) -> ProfessorStorage:
    """
    Get ProfessorStorage instance with database session.

    Args:
        session: Database session from dependency injection

    Returns:
        ProfessorStorage instance
    """
    return ProfessorStorage(session=session)


def get_course_storage(
    session: Annotated[Session, Depends(get_db_session)],
) -> CourseStorage:
    """
    Get CourseStorage instance with database session.

    Args:
        session: Database session from dependency injection

    Returns:
        CourseStorage instance
    """
    return CourseStorage(session=session)


def get_university_storage(
    session: Annotated[Session, Depends(get_db_session)],
) -> UniversityStorage:
    """
    Get UniversityStorage instance with database session.

    Args:
        session: Database session from dependency injection

    Returns:
        UniversityStorage instance
    """
    return UniversityStorage(session=session)
