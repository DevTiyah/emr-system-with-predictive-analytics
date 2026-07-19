# Backend Analysis

## FastAPI Architecture

The backend is a single FastAPI application defined in `main.py`. It uses an application lifespan hook to initialize the SQLite database on startup, mounts static files, configures Jinja2 templates, and exposes both HTML pages and JSON APIs from the same app instance. The code is organized around thin route handlers that delegate work to `backend.database` for persistence and summaries, and `backend.prediction_service` for model inference.

## Route Organization

- UI routes render templates for the shell and auth pages.
- API routes expose bootstrap data, patient CRUD, visit creation, analytics summaries, and disease prediction.
- Legacy alias routes exist for the project specification: `/patient`, `/visit`, and `/predict`.
- FastAPI’s automatic docs are available through the default `/docs`, `/redoc`, and `/openapi.json` endpoints.

## Service Layer

- `backend.database` handles CRUD, seeding, dashboard metrics, and analytics summaries.
- `backend.prediction_service` validates payload shape, loads saved bundles, and returns prediction output.
- `backend.clinical` provides rule-based recommendations and feature-importance extraction.
- `backend.training` is the offline model-building pipeline used to generate the saved artifacts.

## Database Layer

The database layer uses SQLAlchemy ORM with SQLite by default. `init_db()` creates tables and seeds a small demo dataset when the database is empty. Persistence functions operate through a context-managed session boundary.

## Validation

- Pydantic schemas enforce request shapes for patient creation, patient updates, visit creation, and prediction requests.
- Prediction payloads are normalized with `normalize_payload_keys()` and column-name cleaning before inference.
- `PredictionResponse` is declared as the response model for disease-specific endpoints.

## Error Handling

- Missing patient records return 404 responses.
- Invalid patient selection during visit creation returns 400.
- Prediction file loading issues map to 503 responses.
- Prediction payload shape errors map to 400 responses.
- A custom 404 handler returns a JSON message for unknown routes.

## Authentication Implementation

There is no server-side authentication backend. The login/register/reset/profile/logout experience is implemented in the frontend with `static/auth.js` and `localStorage`. The server only renders the related pages.

## Authorization / Role Management

Authorization is client-side only. `static/auth.js` uses the stored session role to hide or show administration-related sections in the shell. There is no server-enforced role policy.

## API Documentation

FastAPI automatically exposes interactive API documentation. The repository does not add a custom OpenAPI schema beyond the route decorators and Pydantic models.

## Logging

There is no dedicated logging configuration module. The training pipeline uses `print()` progress messages, and the frontend uses `console.error()` and `alert()` for user-facing failures.

## Configuration Management

`backend/config.py` centralizes the base directory, dataset directory, saved-model directory, database path, database URL, and disease metadata. The database URL can be overridden with the `DATABASE_URL` environment variable.

## Endpoint Inventory

| URL | Method | Description | Request schema | Response schema |
|---|---|---|---|---|
| `/` | GET | Main EMR shell | None | HTML page (`index.html`) |
| `/login` | GET | Login page | None | HTML page (`login.html`) |
| `/register` | GET | Register page | None | HTML page (`register.html`) |
| `/forgot-password` | GET | Forgot password page | None | HTML page (`forgot_password.html`) |
| `/reset-password` | GET | Reset password page | None | HTML page (`reset_password.html`) |
| `/profile` | GET | Profile page | None | HTML page (`profile.html`) |
| `/logout` | GET | Logout page | None | HTML page (`logout.html`) |
| `/api/bootstrap` | GET | Loads dashboard, analytics, patients, active patient, and visit options | None | JSON with `dashboard`, `analytics`, `patients`, `active_patient`, `visit_options` |
| `/api/patients` | POST | Create patient | `PatientCreate` | JSON `{ "patient": {...} }` |
| `/patient` | POST | Alias for patient creation | `PatientCreate` | JSON `{ "patient": {...} }` |
| `/api/patients/{patient_code}` | GET | Fetch one patient | Path param `patient_code` | JSON `{ "patient": {...} }` |
| `/patient/{patient_code}` | GET | Alias for patient detail | Path param `patient_code` | JSON `{ "patient": {...} }` |
| `/patient/{patient_code}` | PATCH | Update patient fields | `PatientUpdate` | JSON `{ "patient": {...} }` |
| `/api/visits` | POST | Save a visit and update the patient record | `VisitCreate` | JSON `{ "patient": {...} }` |
| `/visit` | POST | Alias for visit creation | `VisitCreate` | JSON `{ "patient": {...} }` |
| `/dashboard` | GET | Dashboard summary | None | JSON summary from `dashboard_summary()` |
| `/analytics` | GET | Analytics summary | None | JSON summary from `analytics_summary()` |
| `/predict/diabetes` | POST | Diabetes risk prediction | `PredictionRequest` | `PredictionResponse` |
| `/predict/hypertension` | POST | Hypertension risk prediction | `PredictionRequest` | `PredictionResponse` |
| `/predict/stroke` | POST | Stroke risk prediction | `PredictionRequest` | `PredictionResponse` |
| `/predict` | POST | Legacy endpoint disabled in favor of disease-specific routes | Request ignored | HTTP 400 JSON error |
