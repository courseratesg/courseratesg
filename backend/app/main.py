"""FastAPI backend service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.routes import router

# Run the application
# poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

app = FastAPI(
    title="CS5224 Backend Service",
    description="FastAPI backend service for CS5224 Cloud Computing project",
    version="0.1.0",
)

# Configure middleware
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api/v1")

@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
