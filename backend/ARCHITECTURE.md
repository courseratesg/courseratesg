# Backend Architecture

## Overview
This is the architecture design for backend api.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   │
│   ├── api/                    # API layer
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py       # Main API router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           └── reviews.py  # Review endpoints
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   └── review.py          # Review schemas (Base, Create, Update, Response)
│   │
│   ├── settings/               # Configuration
│   │   ├── __init__.py
│   │   ├── common.py          # Common settings
│   │   └── app_settings.py    # API and CORS settings
│   │
│   └── storage/                # In-memory storage
│       ├── __init__.py
│       └── review_storage.py  # ReviewStorage class
│
├── tests/                      # Test suite
│   ├── __init__.py
│   └── test_app.py
│
├── .env.local.example         # Environment variables template
├── .gitignore
├── .ruff.toml                 # Ruff configuration
├── Dockerfile                 # Docker configuration
├── pyproject.toml             # Poetry dependencies
├── README.md                  # Project documentation
└── ARCHITECTURE.md            # This file
```

## Key Design Patterns

### 1. Pydantic Schemas for Validation

Three schema types for each entity:

**ReviewBase** - Common fields shared across schemas:
```python
class ReviewBase(BaseModel):
    overall_rating: float = Field(..., ge=1.0, le=5.0)
    difficulty_rating: float = Field(..., ge=1.0, le=5.0)
    workload_rating: float = Field(..., ge=1.0, le=5.0)
    comment: str | None = Field(None, max_length=5000)
    semester: str
    year: int = Field(..., ge=2000, le=2100)
    course_code: str
    university: str
    professor_name: str | None
```

**ReviewCreate** - For creating reviews (inherits from ReviewBase):
```python
class ReviewCreate(ReviewBase):
    pass
```

**ReviewUpdate** - For updates (all fields optional):
```python
class ReviewUpdate(BaseModel):
    overall_rating: float | None = Field(None, ge=1.0, le=5.0)
    difficulty_rating: float | None = Field(None, ge=1.0, le=5.0)
    # ... other fields optional
```

**Review** - Response schema with metadata:
```python
class Review(ReviewBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
```

### 2. In-Memory Storage Pattern

The `ReviewStorage` class provides a simple repository interface:

```python
class ReviewStorage:
    def __init__(self):
        self._reviews: dict[int, Review] = {}
        self._next_id: int = 1

    def create(self, review_in: ReviewCreate) -> Review
    def get(self, review_id: int) -> Optional[Review]
    def get_all(self, skip: int, limit: int) -> list[Review]
    def update(self, review_id: int, review_in: ReviewUpdate) -> Optional[Review]
    def delete(self, review_id: int) -> bool
    # Keyword-only arguments using * for clarity
    def filter_reviews(self, *, professor_name, course_code, university, ...) -> list[Review]
    def get_stats(self, *, professor_name, course_code, university) -> dict
```

**Benefits**:
- Encapsulates data access logic
- Easy to replace with database implementation later
- Consistent interface for CRUD operations
- Type-safe with proper return types

### 3. RESTful API Design

**Resource-based URLs**:
- `/api/v1/reviews/` - Collection endpoint
- `/api/v1/reviews/{id}` - Single resource endpoint
- `/api/v1/reviews/stats` - Aggregated statistics

**Query Parameters for Filtering**:
```python
from typing import Annotated
from fastapi import Query, Depends

@router.get("/")
def list_reviews(
    # Query parameters with validation
    professor_name: Annotated[str | None, Query(description="Filter by professor name")] = None,
    course_code: Annotated[str | None, Query(description="Filter by course code")] = None,
    university: Annotated[str | None, Query(description="Filter by university")] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    # Dependencies last
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)] = ...,
):
    # Filter logic
```

**Proper HTTP Methods**:
- `POST /reviews/` - Create (201 Created)
- `GET /reviews/` - List (200 OK)
- `GET /reviews/{id}` - Retrieve (200 OK)
- `PUT /reviews/{id}` - Update (200 OK)
- `DELETE /reviews/{id}` - Delete (204 No Content)

### 4. Settings Management

Using `pydantic-settings` for configuration:

```python
class AppSettings(BaseSettings):
    api_prefix: str = Field(default="/api")
    api_version: str = Field(default="v1")
    allowed_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_ignore_empty=True,
        extra="ignore",
    )

settings = AppSettings()  # Global singleton
```

### 5. Code Style and Conventions

#### Annotated Type Hints

All FastAPI parameters use Python's `Annotated` type for clarity and consistency:

```python
from typing import Annotated
from fastapi import Path, Query, Depends

# Path parameters with validation
review_id: Annotated[int, Path(description="Review ID", gt=0)]

# Query parameters with constraints
skip: Annotated[int, Query(ge=0)] = 0
limit: Annotated[int, Query(ge=1, le=100)] = 100
professor_name: Annotated[str | None, Query(description="Filter by professor name")] = None

# Dependencies
review_storage: Annotated[ReviewStorage, Depends(get_review_storage)] = ...
```

**Benefits**:
- **Type Safety**: Full IDE support and type checking
- **Validation**: Embedded constraints (ge, le, gt, lt, max_length)
- **Documentation**: Automatic OpenAPI docs generation
- **Consistency**: Uniform pattern across all endpoints
- **Python Standard**: PEP 593 recommended practice

#### Parameter Ordering

Consistent parameter order across all endpoints:

```python
@router.put("/{review_id}")
def update_review(
    # 1. Path parameters first
    review_id: Annotated[int, Path(description="Review ID", gt=0)],

    # 2. Request body
    review_in: review_schema.ReviewUpdate,

    # 3. Query parameters (if any)
    # skip: Annotated[int, Query(ge=0)] = 0,

    # 4. Dependencies last
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)] = ...,
) -> Any:
    # Implementation
```

**Order**: Path → Body → Query → Dependencies

**Rationale**:
- Matches URL structure (path comes before query string)
- FastAPI best practices
- Consistent and predictable
- Dependencies at end (cross-cutting concerns)

#### Keyword-Only Arguments

Storage methods use `*` to enforce keyword-only arguments:

```python
def filter_reviews(
    self,
    *,  # Everything after this must be keyword-only
    professor_name: str | None = None,
    course_code: str | None = None,
    university: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Review]:
    # Implementation
```

**Usage**:
```python
# Correct - named arguments
reviews = storage.filter_reviews(
    professor_name="John Doe",
    course_code="CS5224",
    skip=0,
    limit=10
)

# Error - positional arguments not allowed
reviews = storage.filter_reviews("John Doe", "CS5224", 0, 10)  # ❌
```

**Benefits**:
- Prevents parameter confusion
- Self-documenting code
- Easier refactoring (can reorder params)
- Clear intent at call site

## Data Flow

### Creating a Review

```
Client Request (POST /api/v1/reviews/)
    ↓
FastAPI Endpoint (reviews.py)
    ↓
Pydantic Schema Validation (ReviewCreate)
    ↓
ReviewStorage.create()
    ├── Generate ID
    ├── Add timestamps
    └── Store in memory dict
    ↓
Pydantic Schema Serialization (Review)
    ↓
JSON Response (201 Created)
```

### Filtering Reviews

```
Client Request (GET /api/v1/reviews/?professor_name=John+Doe)
    ↓
FastAPI Endpoint with Query Parameters
    ↓
ReviewStorage.filter_reviews(professor_name="John Doe")
    ├── Iterate through all reviews
    ├── Filter by case-insensitive name match
    ├── Apply pagination (skip/limit)
    └── Return filtered list
    ↓
Pydantic Schema Serialization (list[Review])
    ↓
JSON Response (200 OK)
```

### Getting Statistics

```
Client Request (GET /api/v1/reviews/stats?course_code=CS5224&university=NUS)
    ↓
FastAPI Endpoint (reviews.py)
    ↓
ReviewStorage.get_stats(course_code="CS5224", university="NUS")
    ├── Filter reviews by course + university
    ├── Calculate avg_overall_rating
    ├── Calculate avg_difficulty_rating
    ├── Calculate avg_workload_rating
    └── Count reviews
    ↓
JSON Response {
    "avg_overall_rating": 4.0,
    "avg_difficulty_rating": 3.75,
    "avg_workload_rating": 4.25,
    "review_count": 2
}
```

## API Endpoints

### Review Management

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/v1/reviews/` | Create new review | 201 |
| GET | `/api/v1/reviews/` | List all reviews | 200 |
| GET | `/api/v1/reviews/me` | Get user's reviews (reserved) | 200 |
| GET | `/api/v1/reviews/stats` | Get aggregated statistics | 200 |
| GET | `/api/v1/reviews/{id}` | Get specific review | 200 |
| PUT | `/api/v1/reviews/{id}` | Update review | 200 |
| DELETE | `/api/v1/reviews/{id}` | Delete review | 204 |

### Query Parameters

**List Reviews** (`GET /api/v1/reviews/`):
- `professor_name` - Filter by professor name
- `course_code` - Filter by course code
- `university` - Filter by university
- `skip` - Pagination offset (default: 0)
- `limit` - Max results (default: 100)

**Statistics** (`GET /api/v1/reviews/stats`):
- `professor_name` - Get stats for professor
- `course_code` - Get stats for course (requires `university`)
- `university` - University filter (used with `course_code`)

## Environment Configuration

Settings are loaded from environment files in this order:
1. `.env.local` (local development, gitignored)
2. `.env` (committed defaults)
3. Environment variables
4. Default values in code

Example `.env.local`:
```bash
API_PREFIX=/api
API_VERSION=v1
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

## Error Handling

Standard HTTP exceptions with FastAPI:

```python
# 404 Not Found
if not review:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Review not found",
    )
```

**Error Response Format**:
```json
{
    "detail": "Review not found"
}
```

**Status Codes**:
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors (automatic via Pydantic)
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Invalid request body
- `500 Internal Server Error` - Unhandled exceptions

## API Versioning

APIs are versioned using URL prefixes:
- Current: `/api/v1/reviews/`
- Future: `/api/v2/reviews/`

The version is configured in `AppSettings`:
```python
api_prefix: str = "/api"
api_version: str = "v1"
```

## Input Validation

Pydantic provides automatic validation at multiple levels:

### Schema-Level Validation (Pydantic Models)

**Type Checking**:
```python
class ReviewBase(BaseModel):
    overall_rating: float  # Must be float/int
    semester: str          # Must be string
```

**Range Validation**:
```python
overall_rating: float = Field(..., ge=1.0, le=5.0)  # 1-5 range
year: int = Field(..., ge=2000, le=2100)            # 2000-2100
```

**String Length**:
```python
comment: str | None = Field(None, max_length=5000)  # Max 5000 chars
```

**Optional vs Required**:
```python
# Required (must be provided)
course_code: str = Field(..., description="Course code")

# Optional (can be None)
professor_name: str | None = Field(None, description="Professor name")
```

### Endpoint-Level Validation (FastAPI Parameters)

**Path Parameter Validation**:
```python
from typing import Annotated
from fastapi import Path

review_id: Annotated[int, Path(description="Review ID", gt=0)]
# Validates: must be integer > 0
```

**Query Parameter Validation**:
```python
from fastapi import Query

skip: Annotated[int, Query(ge=0)] = 0
# Validates: must be integer >= 0

limit: Annotated[int, Query(ge=1, le=100)] = 100
# Validates: must be integer between 1 and 100
```

**Automatic Error Responses**:
```json
// Invalid path parameter (review_id = -1)
{
    "detail": [
        {
            "type": "greater_than",
            "loc": ["path", "review_id"],
            "msg": "Input should be greater than 0",
            "input": "-1"
        }
    ]
}

// Invalid query parameter (limit = 200)
{
    "detail": [
        {
            "type": "less_than_equal",
            "loc": ["query", "limit"],
            "msg": "Input should be less than or equal to 100",
            "input": "200"
        }
    ]
}
```

## Security Features

Current implementation (API-only):
1. **CORS Configuration** - Controlled cross-origin access
2. **Input Validation** - Pydantic schema validation
3. **Type Safety** - Full type hints throughout codebase

Future implementations (other branches):
1. **JWT Authentication** - AWS Cognito token validation
2. **Ownership Checks** - Users can only modify own reviews
3. **SQL Injection Prevention** - SQLAlchemy parameterized queries
4. **Rate Limiting** - API rate limiting per user/IP

## Testing Strategy

The in-memory storage makes testing straightforward:

```python
# No database setup required
storage = ReviewStorage()

# Create test data
review = storage.create(ReviewCreate(...))

# Test filtering
reviews = storage.filter_reviews(professor_name="Test Prof")

# Test stats
stats = storage.get_stats(course_code="CS5224")
```

## Migration Path

### From In-Memory to Database

When merging with database branch:

1. **Replace ReviewStorage** with SQLAlchemy CRUD:
```python
# Before (in-memory)
from app.storage import review_storage
review = review_storage.create(review_in)

# After (database)
from app.crud import crud_review
from app.api.deps import DBSession
review = crud_review.create(db, obj_in=review_in)
```

2. **Update schemas** to use database IDs:
```python
# Before: String-based identifiers
course_code: str
university: str

# After: Foreign keys
course_id: int
university_id: int
```

3. **Add dependency injection**:
```python
from typing import Annotated
from fastapi import Depends

@router.post("/")
def create_review(
    review_in: ReviewCreate,
    db: Annotated[DBSession, Depends(get_db)],  # Add database session
):
    return crud_review.create(db, obj_in=review_in)
```

### Adding Authentication

When merging with auth branch:

1. **Add user context** to storage/CRUD:
```python
from typing import Annotated
from fastapi import Depends

def create_review(
    review_in: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_user)] = ...,
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)] = ...,
):
    return review_storage.create_with_user(review_in, current_user.id)
```

2. **Implement /me endpoint**:
```python
@router.get("/me")
def get_my_reviews(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    current_user: Annotated[User, Depends(get_current_user)] = ...,
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)] = ...,
):
    return review_storage.filter_reviews(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
```

3. **Add ownership checks**:
```python
@router.put("/{review_id}")
def update_review(
    review_id: Annotated[int, Path(description="Review ID", gt=0)],
    review_in: ReviewUpdate,
    current_user: Annotated[User, Depends(get_current_user)] = ...,
    review_storage: Annotated[ReviewStorage, Depends(get_review_storage)] = ...,
):
    review = review_storage.get(review_id)
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this review"
        )
    return review_storage.update(review_id, review_in)
```

## Performance Considerations

### Current (In-Memory)
- **Pros**: Fast, simple, no network latency
- **Cons**: Data lost on restart, not scalable, single instance only

### Future (Database)
- Add connection pooling
- Implement caching (Redis)
- Use database indexes on frequently queried fields
- Optimize N+1 queries with joins

### Future (Production)
- CDN for static assets
- Load balancing across multiple instances
- Database read replicas
- API response caching
