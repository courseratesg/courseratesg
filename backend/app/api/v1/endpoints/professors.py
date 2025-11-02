"""Professor endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.v1.depends.storage import get_professor_storage
from app.schemas.professor import Professor
from app.storage.professor_storage import ProfessorStorage

router = APIRouter(prefix="/professors", tags=["professors"])

# TODO: create professor for admin


@router.get("/", response_model=list[Professor])
def list_professors(
    professor_storage: Annotated[ProfessorStorage, Depends(get_professor_storage)],
    name: Annotated[str | None, Query(description="Filter by professor name (case-insensitive partial match)")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    List all professors with optional name filtering.

    Returns professors extracted from reviews with their review counts.

    Args:
        name: Filter by professor name (partial match)
        skip: Number of records to skip
        limit: Maximum number of records to return
        professor_storage: Professor storage dependency

    Returns:
        List of professors with review counts
    """
    professors = professor_storage.list_professors(
        name=name,
        skip=skip,
        limit=limit,
    )
    return professors
