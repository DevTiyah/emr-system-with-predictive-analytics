# Functional Tests

## Test Environment

- Backend validation used `fastapi.testclient.TestClient`
- Training was run with `python train_models.py`
- Frontend scripts were checked with `node --check`
- Whitespace sanity was checked with `git diff --check`

## Workflow Results

| Workflow | Status | Evidence | Notes |
|---|---|---|---|
| Login page | Pass | GET `/login` returned 200 | HTML auth page renders |
| Register page | Pass | GET `/register` returned 200 | HTML auth page renders |
| Forgot password page | Pass | GET `/forgot-password` returned 200 | HTML auth page renders |
| Reset password page | Pass | GET `/reset-password` returned 200 | HTML auth page renders |
| Profile page | Pass | GET `/profile` returned 200 | HTML auth page renders |
| Logout page | Pass | GET `/logout` returned 200 | HTML auth page renders |
| Dashboard | Pass | GET `/` and `/dashboard` rendered | Dashboard shell and summary sections present |
| Patient creation | Pass | POST `/api/patients` returned 201 | Created patient `PT-100499` in audit run |
| Patient update | Pass | PATCH `/patient/{code}` returned 200 | Partial update succeeded |
| Visit creation | Pass | POST `/api/visits` returned 200 | Visit saved and patient record updated |
| Analytics page | Pass | GET `/analytics` returned 200 | Analytics summary renders |
| Prediction endpoints | Pass | `/predict/diabetes`, `/predict/hypertension`, `/predict/stroke` returned 200 | Live model inference works |
| Reports page | Pass | Main shell contains `id="reports"` | Client-side page section renders |
| Settings page | Pass | Main shell contains `id="settings"` | Client-side page section renders |
| Export actions | Implemented | `exportPatients()` and `downloadReport()` exist in `static/script.js` | Browser automation not available in this environment |

## Prediction Endpoint Checks

| Disease | Input | Result | Probability | Risk level |
|---|---|---|---:|---|
| Diabetes | Realistic high-risk sample | High Risk | 0.9135 | High |
| Hypertension | Realistic high-risk sample | High Risk | 0.7200 | Moderate |
| Stroke | Realistic high-risk sample | High Risk | 0.8600 | High |

## Errors Observed

- No critical runtime errors were observed during the audited backend and training runs.
- A timing command using `/usr/bin/time` was unavailable in this container, so training time was measured with `time.perf_counter()` instead.
- No browser screenshot automation tool was available, so screenshot capture is not included.
