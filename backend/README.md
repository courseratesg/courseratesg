# CourseRate SG Backend

FastAPI backend service for CS5224 Cloud Computing project - CourseRate SG.

## Features

- ✅ **AWS RDS PostgreSQL** integration with connection pooling
- ✅ **SQLAlchemy 2.0** ORM models with migrations (Alembic)
- ✅ **RESTful API** with FastAPI
- ✅ **Local development** with Docker Compose
- 🚧 **Authentication** (AWS Cognito) - Coming soon

## Quick Start (Local Development)

```bash
# 1. Start PostgreSQL database
docker-compose up -d

# 2. Set up environment
cp .env.local.example .env.local
poetry install

# 3. Initialize database migrations (only needed if alembic/versions/ is empty)
# Skip this step if migrations already exist
poetry run alembic revision --autogenerate -m "Initial schema"

# 4. Run migrations and seed data
poetry run alembic upgrade head
poetry run python scripts/seed_database.py

# 5. Start the application
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access the API at:

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Architecture

The backend follows a clean architecture with clear separation of concerns:

- **app/settings**: Application configuration (RDS, API, CORS)
- **app/infrastructure**: Database clients and connection pooling
- **app/models**: SQLAlchemy ORM models (University, Professor, Course, Review)
- **app/schemas**: Pydantic schemas for validation and serialization
  - Base classes for shared fields (e.g., `ReviewBase`)
  - Create schemas for input validation (e.g., `ReviewCreate`)
  - Response schemas with computed fields (e.g., `Review`)
- **app/storage**: Database storage layer
  - Storage classes use SQLAlchemy sessions for database queries
  - Case-insensitive filtering with `func.lower()`
  - Database aggregation for statistics
  - Proper pagination with offset/limit
- **app/api**: API endpoints organized by version
  - Dependency injection for database sessions and storage
  - RESTful endpoint design

## Development

### Prerequisites

- **Python 3.11+**
- **Poetry** - Python package manager
- **Docker** - For local PostgreSQL database

### Install Poetry

```bash
# On macOS/Linux/WSL
curl -sSL https://install.python-poetry.org | python3 -

# Or using pip
pip install poetry

# Verify installation
poetry --version
```

For more installation options, visit [Poetry's official documentation](https://python-poetry.org/docs/#installation).

### Install Dependencies

```bash
poetry install
```

### (Optional) Install pymake

For running Makefile commands on Windows or systems without `make`:

```bash
pip install pymake
```

### Local Database Setup

The project includes a `docker-compose.yml` for local PostgreSQL development:

```bash
# Start database (PostgreSQL + pgAdmin)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose down
```

**Connection details:**

- Host: `localhost:5432`
- Database: `cs5224_dev`
- Username: `dev_user`
- Password: `dev_password`

### Environment Configuration

Copy the local environment template:

```bash
cp .env.local.example .env.local
```

The `.env.local` file contains local database configuration:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cs5224_dev
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
```

### Database Management

#### Using psql (CLI)

```bash
# Connect to the database
docker exec -it cs5224-postgres-dev psql -U dev_user -d cs5224_dev

# Common commands:
\dt                        # List tables
\d reviews                 # Describe table
SELECT * FROM universities; # Query data
\q                         # Exit
```

#### Using pgAdmin (GUI)

1. Open http://localhost:5050
2. Login: `admin@cs5224.com` / `admin`
3. Add server: Host=`postgres`, Port=`5432`, Database=`cs5224_dev`, User=`dev_user`, Password=`dev_password`

#### Reset Database

```bash
# Method 1: Using seed script (recommended)
poetry run python scripts/seed_database.py
# Answer 'y' when prompted. It will reset auto-increment ID.

# Method 2: Drop and recreate
docker-compose down -v
docker-compose up -d
poetry run alembic upgrade head
poetry run python scripts/seed_database.py
```

### Database Migrations

#### First Time Setup (If No Migrations Exist)

If `alembic/versions/` directory is empty, generate the initial migration:

```bash
# Generate initial migration based on current models
poetry run alembic revision --autogenerate -m "Initial schema"

# Review the generated migration file in alembic/versions/

# Apply the migration
poetry run alembic upgrade head
```

#### Making Schema Changes

1. Update models in `app/models/`
2. Create migration: `poetry run alembic revision --autogenerate -m "Add new field"`
3. Review generated migration in `alembic/versions/`
4. Apply migration: `poetry run alembic upgrade head`

#### Rollback & History

```bash
poetry run alembic downgrade -1              # Rollback one version
poetry run alembic downgrade <revision_id>   # Rollback to specific version
poetry run alembic history                   # View migration history
poetry run alembic current                   # Current version
```

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
- `GET /health/detailde` - Detailed health check point including database connection

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

### Database Storage

The application uses PostgreSQL with SQLAlchemy ORM:

- **Local**: Docker Compose PostgreSQL for development
- **Production**: AWS RDS PostgreSQL with automatic migrations
- **Migrations**: Alembic for schema version control
- **Connection pooling**: Configured for production scale

Key features:

- Case-insensitive search queries
- Database aggregation for statistics
- Proper indexing for performance
- Denormalized fields to avoid JOINs

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (AWS RDS in production, Docker in local)
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Package Manager**: Poetry
- **Deployment**: Docker + AWS ECS

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API routes and endpoints
│   │   ├── depends/     # Dependency injection
│   │   └── routes/      # Route handlers
│   ├── infrastructure/  # RDS client and infrastructure
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic schemas
│   ├── settings/        # Configuration settings
│   └── storage/         # Data access layer
├── alembic/             # Database migrations
│   └── versions/        # Migration files
├── scripts/             # Utility scripts (seed, etc.)
├── tests/               # Test suite
├── docker-compose.yml   # Local PostgreSQL setup
└── Dockerfile           # Production container image
```

## Docker Compose Commands

```bash
docker-compose up -d       # Start services
docker-compose down        # Stop services
docker-compose down -v     # Stop and remove volumes (data will be lost)
docker-compose logs -f     # View logs
docker-compose ps          # Check status
docker-compose restart     # Restart services
```

## Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps
docker-compose logs postgres

# Restart if needed
docker-compose restart postgres
```

### Port Already in Use

Modify `docker-compose.yml` to use different port:

```yaml
ports:
  - "5433:5432" # Use port 5433 instead
```

Then update `.env`:

```bash
DB_PORT=5433
```

### Clean Start

If you need to completely reset the database and migrations:

```bash
# 1. Stop and remove database volumes
docker-compose down -v

# 2. Remove existing migration files (keep __init__.py)
rm -rf alembic/versions/*.py

# 3. Start fresh database
docker-compose up -d

# 4. Generate initial migration from models
poetry run alembic revision --autogenerate -m "Initial schema"

# 5. Apply migrations
poetry run alembic upgrade head

# 6. Seed database with sample data
poetry run python scripts/seed_database.py
```

## Switching Between Local and AWS RDS

**Local Development:**

```bash
DB_HOST=localhost
DB_PORT=5432
```

**AWS RDS:**

```bash
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=<db-name>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

**Note:** For RDS without public access, you need VPN/bastion host or same VPC deployment.
