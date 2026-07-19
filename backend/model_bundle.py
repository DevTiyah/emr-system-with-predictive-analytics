"""Serializable ML bundle used for inference.

The bundle keeps the fitted preprocessor and the fitted estimator together.
That makes inference simple for the API while still allowing the training
script to compare multiple models before choosing the best one.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class DiseaseModelBundle:
    """A fitted preprocessing-and-model package for one disease."""

    disease: str
    display_name: str
    feature_names: list[str]
    target_name: str
    preprocessor: Any = field(repr=False)
    estimator: Any = field(repr=False)
    transformed_feature_names: list[str] = field(default_factory=list)
    positive_class: int = 1

    def _to_frame(self, features: dict[str, Any] | pd.DataFrame) -> pd.DataFrame:
        if isinstance(features, pd.DataFrame):
            frame = features.copy()
        else:
            frame = pd.DataFrame([features])

        missing = [name for name in self.feature_names if name not in frame.columns]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        return frame[self.feature_names]

    def transform(self, features: dict[str, Any] | pd.DataFrame) -> np.ndarray:
        frame = self._to_frame(features)
        return self.preprocessor.transform(frame)

    def predict(self, features: dict[str, Any] | pd.DataFrame) -> np.ndarray:
        transformed = self.transform(features)
        return self.estimator.predict(transformed)

    def predict_proba(self, features: dict[str, Any] | pd.DataFrame) -> np.ndarray:
        transformed = self.transform(features)
        if hasattr(self.estimator, "predict_proba"):
            return self.estimator.predict_proba(transformed)
        decision = self.estimator.decision_function(transformed)
        probability = 1.0 / (1.0 + np.exp(-decision))
        return np.column_stack([1 - probability, probability])
