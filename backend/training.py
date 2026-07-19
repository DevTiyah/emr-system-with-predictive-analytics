"""Disease-specific model training pipeline.

This module loads the Kaggle datasets, cleans them, compares multiple
classifiers, and stores the best-performing bundle for each disease. The goal
is to keep the training logic understandable while still using a professional
machine-learning workflow.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight

try:
    from imblearn.over_sampling import SMOTE
except Exception:  # pragma: no cover - optional dependency
    SMOTE = None

try:
    from xgboost import XGBClassifier
except Exception:  # pragma: no cover - optional dependency
    XGBClassifier = None

from backend.config import BASE_DIR, DISEASE_SPECS, SAVED_MODELS_DIR
from backend.data_utils import clean_dataframe, normalize_column_name, ordered_unique
from backend.model_bundle import DiseaseModelBundle


def _print_step(message: str) -> None:
    print(f"[training] {message}")


def find_dataset_file(spec) -> Path:
    """Search local and workspace-wide fallback paths for the dataset file."""

    candidates = []
    for name in spec.dataset_names:
        candidates.append(BASE_DIR / "datasets" / name)
        candidates.append(BASE_DIR / name)
        candidates.append(BASE_DIR.parent.parent / name / name)
        candidates.append(BASE_DIR.parent.parent / name)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"No dataset found for {spec.display_name}")


def detect_target_column(frame: pd.DataFrame, target_candidates: tuple[str, ...]) -> str:
    for candidate in target_candidates:
        normalized = normalize_column_name(candidate)
        if normalized in frame.columns:
            return normalized
    raise ValueError(f"Could not detect target column from: {target_candidates}")


def build_preprocessor(features: pd.DataFrame) -> ColumnTransformer:
    numeric_columns = features.select_dtypes(include=[np.number, "bool"]).columns.tolist()
    categorical_columns = [column for column in features.columns if column not in numeric_columns]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, numeric_columns),
            ("categorical", categorical_pipeline, categorical_columns),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def candidate_models(class_imbalance_ratio: float) -> list[tuple[str, Any]]:
    models: list[tuple[str, Any]] = [
        ("logistic_regression", LogisticRegression(max_iter=2000, class_weight="balanced")),
        (
            "random_forest",
            RandomForestClassifier(
                n_estimators=300,
                random_state=42,
                class_weight="balanced",
            ),
        ),
        ("gradient_boosting", GradientBoostingClassifier(random_state=42)),
    ]
    if XGBClassifier is not None:
        scale_pos_weight = class_imbalance_ratio if class_imbalance_ratio > 1 else 1.0
        models.append(
            (
                "xgboost",
                XGBClassifier(
                    n_estimators=250,
                    max_depth=4,
                    learning_rate=0.08,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    eval_metric="logloss",
                    tree_method="hist",
                    random_state=42,
                    scale_pos_weight=scale_pos_weight,
                ),
            )
        )
    return models


def evaluate_model(name: str, estimator: Any, X_valid: np.ndarray, y_valid: pd.Series) -> dict[str, Any]:
    predictions = estimator.predict(X_valid)
    probabilities = estimator.predict_proba(X_valid)[:, 1] if hasattr(estimator, "predict_proba") else None

    metrics = {
        "model": name,
        "accuracy": round(float(accuracy_score(y_valid, predictions)), 4),
        "precision": round(float(precision_score(y_valid, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_valid, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_valid, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_valid, probabilities)) if probabilities is not None else 0.0, 4),
        "confusion_matrix": confusion_matrix(y_valid, predictions).tolist(),
        "classification_report": classification_report(y_valid, predictions, zero_division=0, output_dict=True),
    }
    return metrics


def build_feature_manifest(spec, features: pd.DataFrame, transformed_feature_names: list[str]) -> dict[str, Any]:
    numeric_columns = features.select_dtypes(include=[np.number, "bool"]).columns.tolist()
    categorical_columns = [column for column in features.columns if column not in numeric_columns]
    return {
        "disease": spec.key,
        "display_name": spec.display_name,
        "original_features": ordered_unique(features.columns.tolist()),
        "numeric_features": numeric_columns,
        "categorical_features": categorical_columns,
        "transformed_features": transformed_feature_names,
    }


def train_one_disease(spec) -> dict[str, Any]:
    _print_step(f"Loading dataset for {spec.display_name}...")
    dataset_path = find_dataset_file(spec)
    raw_frame = pd.read_csv(dataset_path)
    cleaned_frame = clean_dataframe(raw_frame)
    target_column = detect_target_column(cleaned_frame, spec.target_candidates)
    feature_frame = cleaned_frame.drop(columns=[target_column])
    target_series = cleaned_frame[target_column].astype(int)

    _print_step(f"Cleaning data for {spec.display_name}: {len(cleaned_frame)} rows, {feature_frame.shape[1]} features.")
    X_train, X_valid, y_train, y_valid = train_test_split(
        feature_frame,
        target_series,
        test_size=0.2,
        random_state=42,
        stratify=target_series,
    )

    preprocessor = build_preprocessor(X_train)
    X_train_processed = preprocessor.fit_transform(X_train)
    X_valid_processed = preprocessor.transform(X_valid)

    minority = int(y_train.value_counts().min())
    majority = int(y_train.value_counts().max())
    imbalance_ratio = majority / max(1, minority)
    use_smote = SMOTE is not None and minority >= 6 and imbalance_ratio >= 1.4

    if use_smote:
        _print_step(f"Applying SMOTE for {spec.display_name}.")
        X_fit, y_fit = SMOTE(random_state=42).fit_resample(X_train_processed, y_train)
        sample_weight = None
    else:
        X_fit, y_fit = X_train_processed, y_train
        sample_weight = compute_sample_weight(class_weight="balanced", y=y_fit)

    candidate_results: list[dict[str, Any]] = []
    trained_estimators: dict[str, Any] = {}
    _print_step(f"Training candidate models for {spec.display_name}...")

    for model_name, estimator in candidate_models(imbalance_ratio):
        fitted = estimator
        try:
            if sample_weight is not None:
                fitted.fit(X_fit, y_fit, sample_weight=sample_weight)
            else:
                fitted.fit(X_fit, y_fit)
        except TypeError:
            fitted.fit(X_fit, y_fit)
        metrics = evaluate_model(model_name, fitted, X_valid_processed, y_valid)
        candidate_results.append(metrics)
        trained_estimators[model_name] = fitted
        _print_step(f"{spec.display_name} -> {model_name}: F1={metrics['f1']}, ROC-AUC={metrics['roc_auc']}")

    best_result = sorted(candidate_results, key=lambda item: (item["f1"], item["roc_auc"], item["accuracy"]), reverse=True)[0]
    best_estimator = trained_estimators[best_result["model"]]
    transformed_feature_names = list(preprocessor.get_feature_names_out()) if hasattr(preprocessor, "get_feature_names_out") else [f"feature_{index}" for index in range(X_train_processed.shape[1])]

    bundle = DiseaseModelBundle(
        disease=spec.key,
        display_name=spec.display_name,
        feature_names=feature_frame.columns.tolist(),
        target_name=target_column,
        preprocessor=preprocessor,
        estimator=best_estimator,
        transformed_feature_names=transformed_feature_names,
    )

    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = SAVED_MODELS_DIR / spec.model_filename
    scaler_path = SAVED_MODELS_DIR / spec.scaler_filename
    feature_names_path = SAVED_MODELS_DIR / spec.feature_names_filename
    report_path = SAVED_MODELS_DIR / spec.report_filename

    _print_step(f"Saving artifacts for {spec.display_name}...")
    joblib.dump(bundle, model_path)
    numeric_scaler = None
    if hasattr(preprocessor, "named_transformers_") and "numeric" in preprocessor.named_transformers_:
        numeric_transformer = preprocessor.named_transformers_["numeric"]
        if hasattr(numeric_transformer, "named_steps") and "scaler" in numeric_transformer.named_steps:
            numeric_scaler = numeric_transformer.named_steps["scaler"]
    joblib.dump(numeric_scaler, scaler_path)

    feature_manifest = build_feature_manifest(spec, feature_frame, transformed_feature_names)
    feature_names_path.write_text(json.dumps(feature_manifest, indent=2), encoding="utf-8")

    report = {
        "dataset": str(dataset_path),
        "rows": int(len(cleaned_frame)),
        "target": target_column,
        "class_balance": y_train.value_counts().to_dict(),
        "candidate_results": candidate_results,
        "best_model": best_result,
        "artifacts": {
            "model": str(model_path),
            "scaler": str(scaler_path),
            "feature_names": str(feature_names_path),
            "report": str(report_path),
        },
        "feature_manifest": feature_manifest,
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    _print_step(f"Complete for {spec.display_name}.")
    return report


def train_all_diseases() -> dict[str, Any]:
    reports = {}
    for spec in DISEASE_SPECS.values():
        reports[spec.key] = train_one_disease(spec)
    return reports
