# Defense Guide

## One-Sentence Pitch

This project is an EMR predictive analytics system that combines real disease-risk models, a patient record workflow, and explainable clinical decision support in a single FastAPI application.

## What To Emphasize

- Real datasets were used for model training.
- Separate models were trained for diabetes, hypertension, and stroke.
- The app includes EMR-style patient registration, update, and visit recording.
- The system returns both predictions and rule-based recommendations.
- The frontend consumes live API data from the same backend.

## Likely Questions And Good Answers

### Why FastAPI?

FastAPI gives us typed request validation, automatic docs, and a clean API-first structure for the EMR and prediction workflows.

### Why SQLite?

SQLite keeps the demo portable and easy to grade locally. The code is structured so the database backend can be migrated later.

### Why are the hypertension and stroke scores so high?

Those datasets appear to be highly separable, so the best models achieve near-perfect evaluation metrics. That should be presented carefully as dataset-specific performance.

### What was the most important bug fixed?

The patient creation endpoint returned a detached ORM object and could produce a 500 error. That was corrected during QA, and the update workflow was added afterward.

### How is the prediction output explained?

The backend returns prediction labels, probability, confidence, feature values used, and feature importance when available, then adds rule-based clinical suggestions.

## Closing Statement

The strongest defense is that the project moved from a mostly synthetic or limited implementation to a working EMR system with real data, validated models, and tested record-management workflows.