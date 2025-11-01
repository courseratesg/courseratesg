"""API routes for the backend service."""

from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/v1/ping")
def ping():
    """Ping endpoint to test API availability."""
    return {"message": "pong", "timestamp": datetime.now().isoformat()}
