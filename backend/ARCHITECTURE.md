# Backend Architecture & Code Explanation

## Overview

This document provides a comprehensive explanation of the CourseRate SG backend architecture, implementation patterns, and codebase structure.

**Purpose:** Course review platform backend supporting multiple Singapore universities.

---

## Tech Stack

- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (AWS RDS in production, Docker locally)
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Authentication:** AWS Cognito (JWT tokens)
- **Package Manager:** Poetry
- **Deployment:** Docker + AWS ECS Fargate

---

## Architecture Overview

### Local Development vs Production

**Local Development:**
- **Backend:** Runs directly with `uvicorn` (no container)
- **Database:** PostgreSQL in Docker container (`docker-compose`)
- **Connection:** Backend → `localhost:5432`

**Production:**
- **Backend:** Containerized (Docker) on AWS ECS Fargate
- **Database:** AWS RDS PostgreSQL (managed service)
- **Connection:** ECS Container → RDS endpoint

**Production Data Flow:**
```
User Request → AWS ALB → ECS Container → RDS PostgreSQL
```

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                      # FastAPI application entry point
│   ├── api/v1/
│   │   ├── router.py                # Main API router
│   │   ├── endpoints/               # Route handlers
│   │   │   ├── reviews.py           # Review CRUD operations
│   │   │   ├── professors.py        # Professor endpoints
│   │   │   ├── courses.py           # Course endpoints
│   │   │   ├── universities.py      # University listing
│   │   │   └── search.py            # Search functionality
│   │   └── depends/                 # Dependency injection
│   │       ├── auth.py              # Authentication dependencies
│   │       ├── storage.py           # Storage dependencies
│   │       └── settings.py          # Settings dependencies
│   ├── models/                      # SQLAlchemy ORM models
│   │   ├── review.py                # Review table
│   │   ├── professor.py             # Professor table
│   │   ├── course.py                # Course table
│   │   └── university.py            # University table
│   ├── schemas/                     # Pydantic validation schemas
│   ├── storage/                     # Data access layer (Repository)
│   ├── infrastructure/              # RDS client with connection pooling
│   └── settings/                    # Environment-based configuration
├── alembic/                         # Database migrations
├── scripts/seed_database.py         # Database seeding script
├── docker-compose.yml               # Local PostgreSQL setup
├── Dockerfile                       # Production container
└── pyproject.toml                   # Poetry dependencies
```

---

## Core Components

### Dependency Injection

**What is it?** A pattern where components receive dependencies externally rather than creating them internally. FastAPI provides built-in DI support.

**Benefits:**
- **Loose Coupling:** Swap implementations without changing endpoint code
- **Code Reusability:** Share dependencies across endpoints
- **Modularity**: Each component can be developed, tested, and maintained independently
- **Replaceability**: Easy to swap implementations without changing dependent code
- **Robustness**: Centralized error handling and resource lifecycle management
- **Testability**: Easy to mock dependencies in unit tests


### Component Layers

**API Layer ([app/api/v1/endpoints/](app/api/v1/endpoints/)):**
- Route handlers for each resource
- Input validation via Pydantic
- Dependency injection for storage and auth
- Auto-generated OpenAPI documentation

**Storage Layer ([app/storage/](app/storage/)):**
- Repository pattern implementation
- Encapsulates SQLAlchemy queries
- Consistent interface: `create()`, `get()`, `update()`, `delete()`
- Filtering and statistics methods

**Models ([app/models/](app/models/)):**
- SQLAlchemy ORM definitions
- Indexes, foreign keys, constraints
- `TimestampMixin` for `created_at`/`updated_at`

**Infrastructure ([app/infrastructure/](app/infrastructure/)):**
- RDS client with connection pooling
- Session management with auto-commit/rollback

**Schemas ([app/schemas/](app/schemas/)):**
- Pydantic models for validation
- Three types: Base, Create, Update, Response

---

## Database Design

### Tables

**Universities:**
- `id` (PK), `name` (unique, indexed), `review_count`

**Professors:**
- `id` (PK), `name` (indexed), `university_id` (FK), `review_count`

**Courses:**
- `id` (PK), `code` (indexed), `name`, `university_id` (FK), `review_count`

**Reviews:**
- `id` (PK), `user_id` (indexed)
- Ratings: `overall_rating`, `difficulty_rating`, `workload_rating`
- Content: `comment`, `semester`, `year`
- Denormalized: `course_code`, `course_name`, `university_name`, `professor_name`
- Timestamps: `created_at`, `updated_at`
- Composite indexes: `(university_name, course_code)`, `(university_name, professor_name)`

### Design Decisions

1. **Denormalization:** Store strings instead of FKs to avoid JOINs (read-heavy workload)
2. **Composite Indexes:** Optimize multi-criteria filtering

---

## API Design

### RESTful Principles

- **Resource-based URLs:** `/reviews/`, `/reviews/{id}`
- **Query parameters** for filtering (not path parameters)
- **HTTP methods:** GET, POST, PUT, DELETE
- **Status codes:** 200 (OK), 201 (Created), 204 (No Content), 404 (Not Found)

### Endpoints

**Reviews API (`/api/v1/reviews`):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create review | Yes |
| GET | `/` | List with filters | No |
| GET | `/me` | User's reviews | Yes |
| GET | `/stats` | Statistics | No |
| GET | `/{id}` | Get specific | No |
| PUT | `/{id}` | Update | Yes (owner) |
| DELETE | `/{id}` | Delete | Yes (owner) |

**Other APIs:**
- **Professors:** `/api/v1/professors` - List, details, reviews, stats
- **Courses:** `/api/v1/courses` - List, details, reviews, stats, professors
- **Universities:** `/api/v1/universities` - List all
- **Search:** `/api/v1/search` - Search professors, courses, global search, stats

### Query Parameters & Filtering

**Flexible Filtering:**
```
GET /api/v1/reviews/?professor_name=John%20Doe
GET /api/v1/reviews/?course_code=CS5224&university=NUS
GET /api/v1/reviews/?university=NUS&skip=20&limit=10
```

**Parameters:**
- `professor_name` - Case-insensitive professor search
- `course_code` - Case-insensitive course code
- `university` - University name filter
- `skip` - Pagination offset (default: 0)
- `limit` - Max results (default: 100)

### Input Validation

All inputs validated via Pydantic:
- **Type checking:** Automatic type conversion
- **Range validation:** Ratings must be 1-5
- **String limits:** Comment max 5000 chars
- **Required vs optional** fields clearly defined

### API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json
