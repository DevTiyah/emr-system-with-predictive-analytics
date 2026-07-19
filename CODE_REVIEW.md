# Code Review

## Summary

The codebase is in good shape after the FastAPI migration and QA pass. The main functional issue found during review was a real API failure in patient creation, and that issue has been fixed.

## Findings

### High Priority

1. `POST /patient` could fail with a 500 error because patient creation returned a session-bound ORM object after the SQLAlchemy session had closed. This was a real runtime bug, not a style issue. It has been fixed by returning a stable patient code and reloading the record in the API layer.

### Medium Priority

1. The project originally exposed some EMR routes only through `/api/...` paths. Compatibility aliases were added so the simpler project-spec routes also exist.
2. The repository depends on local model artifacts in `saved_models/`. If those files are missing, prediction endpoints will fail with a service error.

### Low Priority

1. The repository contains both `app.py` and `main.py` as entry points. This is fine for compatibility, but it adds a small amount of maintenance overhead.
2. SQLite is appropriate for local development and grading, but PostgreSQL would be the cleaner production target.

## Strengths

- The app is now structured around FastAPI lifespan startup instead of deprecated startup hooks.
- Database access is centralized in one module.
- The training pipeline uses real datasets instead of the old synthetic workflow.
- Prediction, explanation, and clinical recommendation logic are separated cleanly.

## Review Verdict

No blocking code quality issues remain in the touched workflow. The repository is coherent, and the remaining risks are mostly deployment and scaling concerns.