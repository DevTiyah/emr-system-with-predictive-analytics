"""Central project configuration.

This module keeps path and disease settings in one place so the backend,
training script, and API all use the same file layout. That makes the
project easier to explain during defense and easier to migrate later to
PostgreSQL or a different model registry.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "datasets"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
DATABASE_FILE = BASE_DIR / "emr.sqlite3"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_FILE.as_posix()}")


@dataclass(frozen=True)
class DiseaseSpec:
    """Metadata for one disease-specific machine learning pipeline."""

    key: str
    display_name: str
    dataset_names: tuple[str, ...]
    target_candidates: tuple[str, ...]
    model_filename: str
    scaler_filename: str
    feature_names_filename: str
    report_filename: str


DISEASE_SPECS: dict[str, DiseaseSpec] = {
    "diabetes": DiseaseSpec(
        key="diabetes",
        display_name="Diabetes",
        dataset_names=("diabetes.csv", "diabetes_data.csv"),
        target_candidates=("diabetes", "outcome", "target"),
        model_filename="diabetes_model.pkl",
        scaler_filename="diabetes_scaler.pkl",
        feature_names_filename="diabetes_feature_names.json",
        report_filename="diabetes_training_report.json",
    ),
    "hypertension": DiseaseSpec(
        key="hypertension",
        display_name="Hypertension",
        dataset_names=("hypertension_data.csv", "hypertension.csv"),
        target_candidates=("hypertension", "target", "class"),
        model_filename="hypertension_model.pkl",
        scaler_filename="hypertension_scaler.pkl",
        feature_names_filename="hypertension_feature_names.json",
        report_filename="hypertension_training_report.json",
    ),
    "stroke": DiseaseSpec(
        key="stroke",
        display_name="Stroke",
        dataset_names=("stroke_data.csv", "stroke.csv"),
        target_candidates=("stroke", "target", "outcome"),
        model_filename="stroke_model.pkl",
        scaler_filename="stroke_scaler.pkl",
        feature_names_filename="stroke_feature_names.json",
        report_filename="stroke_training_report.json",
    ),
}

MODEL_ALIASES = {spec.display_name.lower(): spec.key for spec in DISEASE_SPECS.values()}
