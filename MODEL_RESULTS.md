# Model Results

## Training Run

- Training script: `python train_models.py`
- Training exit code: 0
- Measured training time: 38.50 seconds

## Candidate Model Comparison

### Diabetes

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 0.7345 | 0.7438 | 0.7493 | 0.7465 | 0.8068 |
| Random Forest | 0.6988 | 0.6973 | 0.7469 | 0.7212 | 0.7554 |
| Gradient Boosting | 0.7375 | 0.7378 | 0.7708 | 0.7539 | 0.8126 |

Selected model: Gradient Boosting

Best-model confusion matrix:

|  | Pred 0 | Pred 1 |
|---|---:|---:|
| Actual 0 | 4294 | 1830 |
| Actual 1 | 1531 | 5149 |

Classification report extract:

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| 0 | 0.7372 | 0.7012 | 0.7187 | 6124 |
| 1 | 0.7378 | 0.7708 | 0.7539 | 6680 |

### Hypertension

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 0.8352 | 0.8246 | 0.8876 | 0.8549 | 0.9050 |
| Random Forest | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Gradient Boosting | 0.9686 | 0.9632 | 0.9800 | 0.9715 | 0.9989 |

Selected model: Random Forest

Best-model confusion matrix:

|  | Pred 0 | Pred 1 |
|---|---:|---:|
| Actual 0 | 2362 | 0 |
| Actual 1 | 0 | 2855 |

Classification report extract:

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| 0 | 1.0000 | 1.0000 | 1.0000 | 2362 |
| 1 | 1.0000 | 1.0000 | 1.0000 | 2855 |

### Stroke

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 0.6893 | 0.7140 | 0.6320 | 0.6705 | 0.7470 |
| Random Forest | 0.9982 | 0.9963 | 1.0000 | 0.9982 | 1.0000 |
| Gradient Boosting | 0.8040 | 0.8112 | 0.7925 | 0.8017 | 0.8872 |

Selected model: Random Forest

Best-model confusion matrix:

|  | Pred 0 | Pred 1 |
|---|---:|---:|
| Actual 0 | 4075 | 15 |
| Actual 1 | 0 | 4092 |

Classification report extract:

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| 0 | 1.0000 | 0.9963 | 0.9982 | 4090 |
| 1 | 0.9963 | 1.0000 | 0.9982 | 4092 |

## Why the Selected Models Were Chosen

- Diabetes: Gradient Boosting had the highest F1 and ROC-AUC.
- Hypertension: Random Forest achieved perfect validation metrics on the saved report.
- Stroke: Random Forest had the strongest F1 and ROC-AUC with near-perfect classification.

## Inference Time

Measured with FastAPI `TestClient` over 10 runs per endpoint:

| Disease | Average inference time | Min | Max |
|---|---:|---:|---:|
| Diabetes | 202.93 ms | 19.86 ms | 1685.29 ms |
| Hypertension | 197.43 ms | 151.49 ms | 321.41 ms |
| Stroke | 232.10 ms | 181.80 ms | 547.88 ms |

Note: these timings include Python and TestClient overhead, not just raw estimator runtime.

## Feature Importance

The live API returns feature importance for tree-based estimators. A sample from the audited prediction run:

| Disease | Top returned features |
|---|---|
| Diabetes | `highbp`, `genhlth`, `bmi`, `age`, `highchol` |
| Hypertension | `cp`, `thalach`, `ca`, `thal`, `oldpeak` |
| Stroke | `avg_glucose_level`, `bmi`, `hypertension`, `work_type`, `age` |

## Prediction Validation Samples

### Diabetes

| Sample | Input basis | Prediction | Probability | Risk level | Clinical recommendation |
|---|---|---|---:|---|---|
| Low | Real dataset row index 5251 | Low Risk | 0.2016 | Low | Routine monitoring and healthy lifestyle reinforcement |
| Medium | Real dataset row index 26678 | Low Risk | 0.6432 | Moderate | Lifestyle counselling and periodic glucose monitoring |
| High | Real dataset row index 37553 | High Risk | 0.8331 | High | HbA1c testing and physician review |

### Hypertension

| Sample | Input basis | Prediction | Probability | Risk level | Clinical recommendation |
|---|---|---|---:|---|---|
| Low | Real dataset row index 165 | Low Risk | 0.0000 | Low | Routine monitoring and healthy lifestyle reinforcement |
| Medium | Sampled from real feature ranges | High Risk | 0.7200 | Moderate | Lifestyle modification and home blood-pressure monitoring |
| High | Real dataset row index 0 | High Risk | 1.0000 | High | Physician review and repeat blood pressure checks |

### Stroke

| Sample | Input basis | Prediction | Probability | Risk level | Clinical recommendation |
|---|---|---|---:|---|---|
| Low | Real dataset row index 39351 | Low Risk | 0.0000 | Low | Routine monitoring and healthy lifestyle reinforcement |
| Medium | Real dataset row index 19416 | High Risk | 0.7867 | Moderate | Blood pressure control, diabetes screening, and vascular follow-up |
| High | Real dataset row index 234 | High Risk | 0.9500 | High | Neurological and vascular monitoring |

## How Predictions Are Generated

1. The API normalizes the submitted feature dictionary.
2. Missing required features raise a validation error.
3. The saved bundle transforms the features with the fitted preprocessor.
4. The estimator predicts class and probability.
5. Clinical rules add recommendations and preventive measures.
6. Tree-based estimators expose feature importance.
