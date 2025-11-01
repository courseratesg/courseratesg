# Backend Service

FastAPI backend service for CS5224 Cloud Computing project.

## Development

### Setup

```bash
poetry install
```

### Run the application

```bash
poetry run python src/app.py
```

Or using uvicorn directly:

```bash
poetry run uvicorn src.app:app --host 0.0.0.0 --port 8080 --reload
```

### Run tests

```bash
poetry run pytest
```

### Lint and format

```bash
poetry run ruff check .
poetry run ruff format .
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /v1/ping` - Ping endpoint
