"""API v1 router."""

from fastapi import APIRouter

from app.api.v1.endpoints import reviews

api_router = APIRouter()

# Include routers
api_router.include_router(reviews.router)
