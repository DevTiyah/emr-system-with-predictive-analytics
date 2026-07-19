# Final Project Report

## Project Title

EMR AI Predictive Analytics System

## Objective

To build a practical academic EMR platform that supports patient record management, disease-risk prediction, and explainable clinical decision support using real datasets.

## Final Implementation

The finished system includes:

- FastAPI backend with automatic API documentation
- SQLite-based EMR storage for patients and visits
- Separate trained models for diabetes, hypertension, and stroke
- Prediction endpoints for each disease
- Dashboard and analytics summaries
- Rule-based clinical recommendations
- Frontend templates and JavaScript integration

## Model Results

- Diabetes best model: Gradient Boosting, accuracy 0.7375, ROC AUC 0.8126
- Hypertension best model: Random Forest, accuracy 1.0000, ROC AUC 1.0000
- Stroke best model: Random Forest, accuracy 0.9982, ROC AUC 1.0000

## QA Outcome

- `POST /patient` works after fixing the detached-object bug.
- `PATCH /patient/{patient_code}` now supports EMR editing.
- `POST /visit` updates the patient record correctly.
- All three prediction endpoints return valid responses.
- Dashboard, analytics, docs, and bootstrap endpoints return successfully.

## Main Improvements Made

1. Replaced the older startup pattern with a FastAPI lifespan initialization.
2. Fixed the patient creation bug that caused a 500 error.
3. Added a true patient update workflow.
4. Preserved the existing UI while aligning it with the API.
5. Added documentation files requested for audit, defense, and submission.

## Limitations

- SQLite is suitable for local demo use but not ideal for long-term production deployment.
- Model quality varies by dataset, and the strongest metrics should be interpreted with dataset context.
- No automated CI pipeline is included yet.

## Conclusion

The project is complete as a functional academic EMR predictive analytics system. It now has working prediction endpoints, EMR operations, validated training artifacts, and the documentation needed for review and defense.