# SANAA

Marketplace connecting clients with local manual workers. Django + DRF, PostgreSQL, React, Docker Compose.

## Install and run
1. Install Docker Desktop and Git.
2. `git clone <repository url>` then `cd sanaa`
3. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` on Windows, `cp` on Linux/macOS).
4. `docker compose up --build`
5. In a second terminal: `docker compose exec backend python manage.py migrate`
6. API docs: http://localhost:8080/api/docs/

## Tests and checks
    docker compose exec backend pytest
    docker compose exec backend ruff check .
    docker compose exec backend black --check .
    docker compose exec backend lint-imports

## Project structure
    backend/   Django project: config/, common/ (shared helpers), apps/ (accounts, workers, jobs, reviews)
    frontend/  React app

## Git workflow
`main` is stable. Work on `feature/<task-id>-name`, open a pull request, get one review before merging.
