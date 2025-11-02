"""University endpoints."""

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Query

from app.api.v1.depends.storage import get_university_storage
from app.schemas.university import University
from app.storage.university_storage import UniversityStorage

router = APIRouter(prefix="/universities", tags=["universities"])


# TODO: create university for admin


@router.get("/", response_model=list[University])
def list_universities(
    university_storage: Annotated[UniversityStorage, Depends(get_university_storage)],
    name: Annotated[
        Optional[str],
        Query(description="Filter by university name (case-insensitive partial match)"),
    ] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> Any:
    """
    List all universities with optional name filtering.

    Returns universities extracted from reviews with their review counts.

    Args:
        name: Filter by university name (partial match)
        skip: Number of records to skip
        limit: Maximum number of records to return
        university_storage: University storage dependency

    Returns:
        List of universities with review counts
    """
    universities = university_storage.list_universities(
        name=name,
        skip=skip,
        limit=limit,
    )
    return universities
