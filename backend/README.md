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
  - Base classes for shared fields (e.g., `UniversityBase`)
  - Create schemas for input validation (e.g., `UniversityCreate`)
  - Response schemas with computed fields (e.g., `University`)
- **app/storage**: In-memory storage layer
  - `DataStore`: Central data access layer managing all entities (universities, professors, courses, reviews)
  - Storage classes: Business logic for entity-specific operations
  - Will be replaced with database session in RDS branch
- **app/api**: API endpoints organized by version
  - Dependency injection for storage instances
  - RESTful endpoint design

## Development

### Prerequisites

- Python 3.11+
- Poetry (Python package manager)

**Install Poetry:**

```bash
# On macOS/Linux/WSL
curl -sSL https://install.python-poetry.org | python3 -

# Or using pip
pip install poetry

# Verify installation
poetry --version
```

For more installation options, visit [Poetry's official documentation](https://python-poetry.org/docs/#installation).

### Setup

1. Install dependencies:

```bash
poetry install
```

2. (Optional) Install pymake for running Makefile commands on Windows:

```bash
# Only needed on Windows or systems without make
pip install pymake
```

3. (Optional) Create a `.env.local` file for custom configuration:

```bash
cp .env.local.example .env.local
```

4. Configure database settings in `.env.local` file

### Run the application

**Using Makefile (recommended):**

```bash
# On macOS/Linux (with make installed)
make run-dev

# On Windows or systems without make, install pymake first:
pip install py-make
pymake run-dev

# Or run directly with poetry
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

The API will be available at:

- API: http://localhost:8080
- Interactive API docs (Swagger): http://localhost:8080/docs
- Alternative API docs (ReDoc): http://localhost:8080/redoc

### Lint, format, and check

**Using Makefile (recommended):**

```bash
# Quick fix and format
make ruff

# Format only
make format

# Run all checks (ruff, mypy, bandit)
make check
```

**Or run commands directly:**

```bash
poetry run ruff check . --fix
poetry run ruff format .
poetry run mypy .
poetry run bandit -r app
```

### Available Makefile commands

- `make run` - Run the server (production mode)
- `make run-dev` - Run the server with auto-reload (development mode)
- `make ruff` - Fix linting issues and format code
- `make format` - Format code only
- `make check` - Run all checks (linting, formatting, type checking, security)

**Note:** On Windows or systems without `make`, replace `make` with `pymake` in all commands above (e.g., `pymake run-dev`).

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

**Statistics**
- `GET /api/v1/reviews/stats?professor_name={name}` - Get aggregated stats for a professor
- `GET /api/v1/reviews/stats?course_code={code}&university={uni}` - Get aggregated stats for a course

### Professor Management

- `GET /api/v1/professors/` - List all professors (with pagination)
- `GET /api/v1/professors/?name={name}` - Filter professors by name (partial match)

### Course Management

- `GET /api/v1/courses/` - List all courses (with pagination)
- `GET /api/v1/courses/?code={code}` - Filter courses by course code (partial match)
- `GET /api/v1/courses/?university={uni}` - Filter courses by university (exact match)
- `GET /api/v1/courses/?code={code}&university={uni}` - Filter by both

### University Management

- `GET /api/v1/universities/` - List all universities (with pagination)
- `GET /api/v1/universities/?name={name}` - Filter universities by name (partial match)

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

### Professor Schema

Each professor includes:
- **id**: Professor ID (auto-generated)
- **name**: Professor name
- **university_id**: University ID where professor teaches
- **university**: University name (populated from university_id)
- **review_count**: Number of reviews for this professor

### Course Schema

Each course includes:
- **id**: Course ID (auto-generated)
- **code**: Course code (e.g., "CS5224")
- **university_id**: University ID offering this course
- **university**: University name (populated from university_id)
- **review_count**: Number of reviews for this course

### University Schema

Each university includes:
- **id**: University ID (auto-generated)
- **name**: University name (e.g., "NUS")
- **review_count**: Number of reviews for this university

## Example Usage

### Create a review

```bash
curl -X POST "http://localhost:8080/api/v1/reviews/" \
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
curl "http://localhost:8080/api/v1/reviews/?professor_name=John%20Doe"
```

### Get course statistics

```bash
curl "http://localhost:8080/api/v1/reviews/stats?course_code=CS5224&university=NUS"
```

### List all professors

```bash
curl "http://localhost:8080/api/v1/professors/"
```

### Search professors by name

```bash
curl "http://localhost:8080/api/v1/professors/?name=John"
```

### List all courses

```bash
curl "http://localhost:8080/api/v1/courses/"
```

### Search courses by code

```bash
curl "http://localhost:8080/api/v1/courses/?code=CS52"
```

### List all universities

```bash
curl "http://localhost:8080/api/v1/universities/"
```

### Search universities by name

```bash
curl "http://localhost:8080/api/v1/universities/?name=NUS"
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
