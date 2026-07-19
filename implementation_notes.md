# Implementation Notes

## System Architecture

The application is built as a FastAPI backend with a Jinja2-served UI, a SQLite persistence layer, and separate disease-specific machine learning bundles for diabetes, hypertension, and stroke.

## Data Flow

1. Real datasets are loaded from `datasets/`.
2. The training pipeline preprocesses the data and evaluates candidate models.
3. The best model, scaler, and feature manifest are saved to `saved_models/`.
4. The FastAPI layer loads the saved bundle during prediction requests.
5. The EMR layer stores patients and visits in SQLite.

## Backend Changes

- FastAPI replaced the older Flask-style startup and routing surface.
- A lifespan handler initializes the database cleanly.
- `POST /patient`, `GET /patient/{patient_code}`, and `POST /visit` were added as project-spec aliases.
- `PATCH /patient/{patient_code}` was added to support EMR editing.

## Validation Notes

- The live app was tested at `http://127.0.0.1:8000`.
- Patient create, update, get, and visit workflows all passed during live smoke testing.
- Disease prediction endpoints returned structured responses for all three conditions.

## Implementation Detail

The patient update change was necessary because the project needed a real editable EMR record, not just a registration-and-predict flow. The update path now supports partial changes to clinical and demographic fields.

## Maintenance Note

The lowercase `implementation_notes.md` file remains in the repository for compatibility, but this uppercase file is the one matching the requested project deliverable name.