"""Prediction loading and inference utilities."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import joblib
import pandas as pd

from backend.clinical import (
    explain_prediction,
    preventive_measures_for_disease,
    recommendations_for_disease,
    risk_level,
)
from backend.config import DISEASE_SPECS, SAVED_MODELS_DIR
from backend.data_utils import normalize_column_name, normalize_payload_keys, ordered_unique


@lru_cache(maxsize=8)
def load_bundle(disease: str):
    spec = DISEASE_SPECS[disease]
    model_path = SAVED_MODELS_DIR / spec.model_filename
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    return joblib.load(model_path)


def _coerce_value(value: Any) -> Any:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return None
        try:
            number = float(stripped)
            return int(number) if number.is_integer() else number
        except ValueError:
            return stripped
    return value


def _prepare_features(bundle, features: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_payload_keys(features)
    cleaned = {normalize_column_name(key): _coerce_value(value) for key, value in normalized.items()}
    ordered = {name: cleaned.get(name) for name in bundle.feature_names}
    missing = [name for name, value in ordered.items() if value is None]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
    return ordered


def predict(disease: str, features: dict[str, Any]) -> dict[str, Any]:
    bundle = load_bundle(disease)
    payload = _prepare_features(bundle, features)
    frame = pd.DataFrame([payload])
    proba = float(bundle.predict_proba(frame)[0][1])
    prediction = bundle.predict(frame)[0]
    prediction_text = "High Risk" if int(prediction) == 1 else "Low Risk"
    recommendations = recommendations_for_disease(disease, payload)
    preventive_measures = preventive_measures_for_disease(disease, payload)
    explanation = explain_prediction(bundle, bundle.transform(frame))

    return {
        "disease": bundle.display_name,
        "prediction": prediction_text,
        "probability": round(proba, 4),
        "confidence": f"{round(proba * 100)}%",
        "risk_level": risk_level(proba),
        "recommendations": recommendations,
        "preventive_measures": preventive_measures,
        "feature_values_used": payload,
        "feature_importance": explanation,
        "model_features": ordered_unique(bundle.feature_names),
    }
