# Chapter 4 Technical Data

## Implementation Process

- Started from a single FastAPI application and existing Jinja templates.
- Added route rendering for auth pages and kept the existing API contracts intact.
- Reworked the frontend into a structured EMR shell with dashboard, patients, visits, prediction, analytics, reports, and settings sections.
- Trained disease-specific models using the bundled datasets and saved the artifacts under `saved_models/`.

## System Architecture

- Frontend: Jinja2 templates plus `static/script.js` and `static/style.css`
- Backend: FastAPI app in `main.py`
- Database: SQLite through SQLAlchemy in `backend/database.py`
- ML: dataset cleaning, preprocessing, model selection, inference, and explainability modules under `backend/`

## Technology Stack

- FastAPI
- Jinja2
- SQLAlchemy
- SQLite
- pandas
- NumPy
- scikit-learn
- joblib
- Uvicorn / Gunicorn

## Database Implementation

- Database file: `emr.sqlite3`
- Tables: `patients`, `visits`
- Seeded demo records are created automatically when the database is empty
- App-level persistence functions handle create, update, read, summary, and visit recording

## Frontend Implementation

- Single page shell rendered from `templates/index.html`
- Sidebar navigation and top bar
- Dashboard cards and charts
- Patient list with filtering and CSV export
- Patient profile with timeline and risk confidence
- Visit workflow with live preview panel
- AI prediction workbench with dynamic disease-specific inputs
- Analytics summary cards and charts
- Reports and settings panels

## Backend Implementation

- FastAPI route handlers in `main.py`
- Pydantic validation in `backend/schemas.py`
- SQLAlchemy ORM models in `backend/database.py`
- Prediction loading and inference in `backend/prediction_service.py`
- Rule-based clinical advice in `backend/clinical.py`

## Authentication

- Implemented on the frontend with `static/auth.js`
- Session stored in `localStorage`
- No server-side auth middleware or user table

## Dashboard

- Metric cards: total patients, high-risk patients, diabetes cases, hypertension cases, stroke cases, today’s visits
- Charts: monthly visits line chart, disease donut chart, risk distribution, gender bars
- Alerts and attention table from aggregated patient data

## Dataset Description

- Diabetes: 64,020 rows, target `diabetes`
- Hypertension: 26,083 rows, target `target`
- Stroke: 40,910 rows, target `stroke`

## Preprocessing

- normalize column names
- remove duplicates
- coerce yes/no values to binary where possible
- fill numeric missing values with median
- fill categorical missing values with mode
- stratified train/test split
- scaling and imputation inside the pipeline

## Feature Engineering

- No complex manual feature engineering
- Direct use of cleaned clinical variables
- Feature order preserved in manifests for inference consistency

## Model Training

- Candidate models compared: Logistic Regression, Random Forest, Gradient Boosting
- Optional XGBoost if installed
- Class imbalance handled with SMOTE or weights
- Best model selected by F1, then ROC-AUC, then accuracy

## Model Evaluation

- metrics calculated on validation split
- confusion matrix and classification report saved in JSON
- selected model and metrics stored in training report files

## Prediction Pipeline

- API accepts `PredictionRequest`
- payload keys normalized
- saved bundle validates required fields
- preprocessor transforms the data
- estimator predicts class and probability
- clinical rules add guidance and feature importance

## Performance Metrics

- diabetes best F1: 0.7539
- hypertension best F1: 1.0000
- stroke best F1: 0.9982

## Feature Importance

- returned when the estimator exposes `feature_importances_`
- sample outputs were captured from live prediction endpoint responses

## Screens Implemented

- login
- register
- forgot password
- reset password
- profile
- logout
- dashboard
- patients
- visit
- prediction
- analytics
- reports
- settings

## API Endpoints

- `/api/bootstrap`
- `/api/patients`
- `/patient`
- `/api/patients/{patient_code}`
- `/patient/{patient_code}`
- `/api/visits`
- `/visit`
- `/dashboard`
- `/analytics`
- `/predict/diabetes`
- `/predict/hypertension`
- `/predict/stroke`
- `/predict`

## Testing Results

- FastAPI route rendering succeeded for the auth pages, dashboard, and analytics page
- patient creation returned 201
- patient update returned 200
- visit creation returned 200
- prediction endpoints returned 200
- training pipeline completed successfully

## Limitations

- no server-side authentication
- no migration system
- no automated test suite in the repository
- report exports are client-side CSV downloads

## Future Improvements

- add real auth and authorization
- add automated unit/integration tests
- add PDF report generation
- add stronger logging and deployment monitoring
