ruff:
	poetry run ruff check . --fix
	poetry run ruff format

format:
	poetry run ruff check app --fix
	poetry run ruff format app

run:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080
		
run-dev:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
