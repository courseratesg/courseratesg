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
    """
    Health check endpoint for ECS/ALB.

    Returns basic status without checking database to ensure fast response.
    For detailed health including database, use /health/detailed
    """
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/health/detailed")
def health_check_detailed():
    """
    Detailed health check including database connectivity.

    This endpoint checks:
    - Application status
    - Database connection

    Returns 200 if all checks pass, 503 if any check fails.
    """
    from fastapi import HTTPException

    from app.api.v1.depends.storage import get_db_client

    health_status = {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "checks": {"application": "ok", "database": "unknown"},
    }

    # Check database connection
    try:
        db_client = get_db_client()
        is_healthy = db_client.health_check()
        health_status["checks"]["database"] = "ok" if is_healthy else "error"

        if not is_healthy:
            health_status["status"] = "degraded"
            raise HTTPException(status_code=503, detail=health_status)

    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)}"
        health_status["status"] = "error"
        raise HTTPException(status_code=503, detail=health_status) from None

    return health_status


# Include API router
app.include_router(api_router, prefix=f"{settings.api_prefix}/{settings.api_version}")
