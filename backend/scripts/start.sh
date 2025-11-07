#!/bin/bash
set -e

echo "=================================================="
echo "Starting application initialization..."
echo "=================================================="

# Wait for database to be ready
echo "Checking database connection..."
max_retries=30
retry_count=0

until poetry run python -c "
from app.settings.rds_settings import RDSSettings
from sqlalchemy import create_engine, text
settings = RDSSettings()
engine = create_engine(settings.database_url)
with engine.connect() as conn:
    conn.execute(text('SELECT 1'))
print('Database is ready!')
" 2>/dev/null; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    echo "ERROR: Database connection failed after $max_retries attempts"
    exit 1
  fi
  echo "Database not ready yet... retry $retry_count/$max_retries"
  sleep 2
done

# Run database migrations
echo "=================================================="
echo "Running database migrations..."
echo "=================================================="
poetry run alembic upgrade head

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed"
  exit 1
fi

# Start the application
echo "=================================================="
echo "Starting FastAPI application on port ${PORT:-80}..."
echo "=================================================="
exec poetry run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-80}
