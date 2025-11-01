FROM python:3.12-slim

# Install curl for health checks
RUN \
  apt-get update && \
  apt-get install -y --no-install-recommends curl && \
  rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_HOME=/opt/poetry \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1
RUN python -m pip install --no-cache-dir poetry==2.2.1

WORKDIR /app

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies only (no dev dependencies)
RUN poetry install --only main --no-root

# Copy application code
COPY app app

# Install the project
RUN poetry install --only main

CMD [ "sh", "-c", "poetry run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-80}" ]
