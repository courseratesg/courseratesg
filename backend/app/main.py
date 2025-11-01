"""FastAPI backend service."""

from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.depends.settings import get_app_settings
from app.api.v1.router import api_router

# Run the application
# poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

app = FastAPI(
    title="CourseRate SG Backend",
    description="FastAPI backend service",
    version="0.1.0",
)

# Configure CORS middleware
settings = get_app_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


# Include API router
app.include_router(api_router, prefix=f"{settings.api_prefix}/{settings.api_version}")
