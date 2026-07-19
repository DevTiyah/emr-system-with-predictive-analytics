# API Test Report

## Test Environment

- Local server: `http://127.0.0.1:8000`
- Framework: FastAPI
- Database: SQLite

## Verified API Checks

### Health And UI

- `GET /` returned `200`
- `GET /docs` returned `200`
- `GET /dashboard` returned `200`
- `GET /analytics` returned `200`
- `GET /api/bootstrap` returned `200`

### Prediction Endpoints

- `POST /predict/diabetes` returned `200`
- `POST /predict/hypertension` returned `200`
- `POST /predict/stroke` returned `200`

Example observed diabetes output:

- Prediction: `Low Risk`
- Probability: `0.2219`
- Confidence: `22%`

### Patient Workflow

- `POST /patient` returned `201`
- `GET /patient/{patient_code}` returned `200`
- `PATCH /patient/{patient_code}` returned `200`
- `POST /visit` returned `200`

Observed timing from the live smoke test:

- `POST /patient`: about `50.6 ms`
- `PATCH /patient/{patient_code}`: about `11.4 ms`
- `GET /patient/{patient_code}`: about `3.6 ms`

## Defect Found During API QA

- A real `500` error appeared on `POST /patient` during earlier testing.
- Root cause: `backend/database.create_patient()` returned a detached ORM object pattern after the session closed.
- Fix: the function now returns the patient code, and the API layer reloads the patient detail before responding.

## API Verdict

The API is stable for the tested workflows. Core prediction and EMR record-management routes work correctly after the patient-create and patient-update fixes.