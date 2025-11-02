# CourseRate SG Backend

FastAPI backend service for CS5224 Cloud Computing project - CourseRate SG.

## Branch: API-Only (feat/review-api)

This branch focuses on **API design and business logic** without database or authentication integration. It uses in-memory storage for rapid prototyping and testing.

**Separate branches will handle:**
- Database integration (RDS/PostgreSQL)
- Authentication (AWS Cognito)

## Architecture

The backend follows a clean architecture with clear separation of concerns:

- **app/settings**: Application configuration (API settings, CORS)
- **app/schemas**: Pydantic schemas for validation and serialization
- **app/storage**: In-memory storage (will be replaced with database in RDS branch)
- **app/api**: API endpoints organized by version

## Development

### Prerequisites

- Python 3.11+
- Poetry

### Setup

1. Install dependencies:

```bash
poetry install
```

2. (Optional) Create a `.env` file for custom configuration:

```bash
cp .env.local.example .env.local
```

3. Configure database settings in `.env.local` file

### Run the application

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

The API will be available at:

- API: http://localhost:8080
- Interactive API docs (Swagger): http://localhost:8080/docs
- Alternative API docs (ReDoc): http://localhost:8080/redoc

### Lint and format

```bash
poetry run ruff check .
poetry run ruff format .
```

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Review Management

**Create Review**
- `POST /api/v1/reviews/` - Submit a new review

**List Reviews**
- `GET /api/v1/reviews/` - Get all reviews (with pagination)
- `GET /api/v1/reviews/?professor_name={name}` - Filter reviews by professor name
- `GET /api/v1/reviews/?course_code={code}&university={uni}` - Filter reviews by course and university

**User Reviews (Reserved for Auth Branch)**
- `GET /api/v1/reviews/me` - Get current user's reviews (returns empty for now)

**Single Review Operations**
- `GET /api/v1/reviews/{review_id}` - Get specific review
- `PUT /api/v1/reviews/{review_id}` - Update review
- `DELETE /api/v1/reviews/{review_id}` - Delete review

### Statistics

- `GET /api/v1/reviews/stats?professor_name={name}` - Get aggregated stats for a professor
- `GET /api/v1/reviews/stats?course_code={code}&university={uni}` - Get aggregated stats for a course

## Data Models

### Review Schema

Each review includes:
- **overall_rating** (1-5): Overall course rating
- **difficulty_rating** (1-5): Course difficulty
- **workload_rating** (1-5): Course workload
- **comment** (optional): Review comment (max 5000 chars)
<!--TODO: enum?-->
- **semester**: Semester taken (e.g., "AY2024/25 Sem 1")
- **year**: Year (2000-2100)
- **course_code**: Course code (e.g., "CS5224")
- **university**: University name (e.g., "NUS")
- **professor_name** (optional): Professor name

## Example Usage

### Create a review

```bash
curl -X POST "http://localhost:8000/api/v1/reviews/" \
  -H "Content-Type: application/json" \
  -d '{
    "overall_rating": 4.5,
    "difficulty_rating": 3.5,
    "workload_rating": 4.0,
    "comment": "Great course on cloud computing!",
    "semester": "AY2024/25 Sem 1",
    "year": 2024,
    "course_code": "CS5224",
    "university": "NUS",
    "professor_name": "John Doe"
  }'
```

### Get reviews by professor

```bash
curl "http://localhost:8000/api/v1/reviews/?professor_name=John%20Doe"
```

### Get course statistics

```bash
curl "http://localhost:8000/api/v1/reviews/stats?course_code=CS5224&university=NUS"
```

## Features

### Query Parameter Filtering

<!-- TODO: fuzzy search -->
The API supports flexible filtering through query parameters:
- Filter by professor name
- Filter by course code + university
- Combine filters for precise results

### Aggregated Statistics

Get comprehensive statistics for courses and professors:
- Average overall rating
- Average difficulty rating
- Average workload rating
- Total review count

### Pagination

All list endpoints support pagination:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100)

Example: `GET /api/v1/reviews/?skip=10&limit=20`

## Design Principles

### RESTful API Design

- Resource-based URLs (`/reviews/`, `/reviews/{id}`)
- Query parameters for filtering (not path parameters)
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Appropriate status codes (200, 201, 204, 404)

### Input Validation

All inputs are validated using Pydantic schemas:
- Type checking
- Range validation (e.g., ratings 1-5)
- String length limits
- Required vs optional fields

### In-Memory Storage

Current implementation uses in-memory storage for development:
- Fast and simple
- No database setup required
- Easy to test and prototype
- Will be replaced with RDS in database branch

## Next Steps

This API-only branch will be merged with:
1. **Database Branch**: RDS/PostgreSQL integration with SQLAlchemy models
2. **Auth Branch**: AWS Cognito authentication and user management
3. **Deployment Branch**: Docker containerization and AWS deployment
