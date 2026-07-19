# Model Evaluation

## Data Sources

- Diabetes: `datasets/diabetes_data.csv` with 64,020 rows
- Hypertension: `datasets/hypertension_data.csv` with 26,083 rows
- Stroke: `datasets/stroke_data.csv` with 40,910 rows

## Evaluation Method

Each disease pipeline compares three candidate classifiers:

- Logistic Regression
- Random Forest
- Gradient Boosting

The best model is selected from the saved training report for each disease.

## Results Summary

### Diabetes

- Best model: Gradient Boosting
- Accuracy: 0.7375
- Precision: 0.7378
- Recall: 0.7708
- F1-score: 0.7539
- ROC AUC: 0.8126

### Hypertension

- Best model: Random Forest
- Accuracy: 1.0000
- Precision: 1.0000
- Recall: 1.0000
- F1-score: 1.0000
- ROC AUC: 1.0000

### Stroke

- Best model: Random Forest
- Accuracy: 0.9982
- Precision: 0.9963
- Recall: 1.0000
- F1-score: 0.9982
- ROC AUC: 1.0000

## Interpretation

- Diabetes is the hardest of the three tasks. The dataset is larger and the class boundary is less separable, so the result is more realistic than the other two tasks.
- Hypertension and stroke both achieve near-perfect performance on the provided datasets, which is strong but should still be interpreted cautiously because models this accurate may reflect dataset structure, feature leakage, or an easy classification boundary.
- The application correctly saves trained bundles, scalers, and feature manifests for inference.

## Artifacts

- `saved_models/diabetes_model.pkl`
- `saved_models/diabetes_scaler.pkl`
- `saved_models/diabetes_feature_names.json`
- `saved_models/diabetes_training_report.json`
- `saved_models/hypertension_model.pkl`
- `saved_models/hypertension_scaler.pkl`
- `saved_models/hypertension_feature_names.json`
- `saved_models/hypertension_training_report.json`
- `saved_models/stroke_model.pkl`
- `saved_models/stroke_scaler.pkl`
- `saved_models/stroke_feature_names.json`
- `saved_models/stroke_training_report.json`

## Conclusion

The saved models are operational and produce valid disease predictions through the FastAPI inference layer. The evaluation metrics support a usable academic demo, with diabetes being the most balanced benchmark and the other two models performing at a very high level on their datasets.