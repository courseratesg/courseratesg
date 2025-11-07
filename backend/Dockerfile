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
COPY README.md .

# Copy Alembic files for database migrations
COPY alembic alembic
COPY alembic.ini .

# Copy startup script
COPY scripts/start.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

# Install the project
RUN poetry install --only main

# Use startup script that runs migrations before starting the app
CMD ["/app/scripts/start.sh"]
