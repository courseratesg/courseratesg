"""API v1 router."""

from fastapi import APIRouter

from app.api.v1.endpoints import courses, professors, reviews, universities

api_router = APIRouter()

# Include routers
api_router.include_router(reviews.router)
api_router.include_router(professors.router)
api_router.include_router(courses.router)
api_router.include_router(universities.router)
