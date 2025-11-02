ruff:
	poetry run ruff check . --fix
	poetry run ruff format

format:
	poetry run ruff format .

check:
	poetry run ruff check .
	poetry run ruff format . --check
	poetry run mypy .
	poetry run bandit .

run:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080
		
run-dev:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
