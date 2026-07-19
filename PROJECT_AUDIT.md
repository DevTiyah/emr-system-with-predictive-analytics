# Project Audit

## Scope

This audit covers the FastAPI EMR application, the training pipeline, the SQLite persistence layer, the frontend integration, and the saved model artifacts.

## Repository Snapshot

- FastAPI application entrypoint: `main.py`
- Database layer: `backend/database.py`
- Training pipeline: `backend/training.py` and `train_models.py`
- Inference service: `backend/prediction_service.py`
- API schemas: `backend/schemas.py`
- Frontend templates: `templates/index.html` and `templates/result.html`
- Frontend script: `static/script.js`
- Saved model artifacts: `saved_models/*.pkl`, `saved_models/*_training_report.json`
- Real datasets: `datasets/diabetes_data.csv`, `datasets/hypertension_data.csv`, `datasets/stroke_data.csv`

## What Was Verified

- The app boots through FastAPI and serves the UI and API from a single application instance.
- The SQLite database initializes cleanly and seeds demo patients and visits.
- Disease prediction endpoints work for diabetes, hypertension, and stroke.
- Patient creation, retrieval, update, and visit recording work end to end.
- Dashboard and analytics summaries are returned as JSON and consumed by the frontend.
- Training artifacts exist for all three diseases and include model comparison reports.

## Notable Correctness Findings

1. A real 500 error existed in patient creation because the code returned a session-bound ORM object after the session closed. That was fixed by returning the generated patient code and reloading the patient detail in the API layer.
2. The project was missing a true update workflow for EMR records. `PATCH /patient/{patient_code}` was added to support partial updates.
3. The codebase originally exposed some functionality only through `/api/...` routes. Compatibility aliases were added so the project-spec endpoints exist as well.

## Risks And Gaps

- SQLite is appropriate for the current academic/demo build, but it is not the preferred production database.
- The reports and metrics are generated from offline training runs; there is no automated CI pipeline in the repository yet.
- The application depends on local model artifacts being present in `saved_models/`.

## Audit Conclusion

The repository is coherent, functional, and consistent with the stated EMR predictive analytics goal. The major functional gap found during QA was fixed, and the remaining issues are mostly deployment and hardening concerns rather than blocking defects.