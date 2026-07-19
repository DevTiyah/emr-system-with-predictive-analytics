"""Rule-based clinical decision support helpers.

These rules are deliberately separate from the ML models so the project can
show both predictive analytics and explainable clinical guidance during the
presentation. The model estimates risk, while the rules explain what to do
next.
"""

from __future__ import annotations

from collections import OrderedDict
from typing import Any


def risk_level(probability: float) -> str:
    if probability >= 0.8:
        return "High"
    if probability >= 0.55:
        return "Moderate"
    return "Low"


def recommendations_for_disease(disease: str, features: dict[str, Any]) -> list[str]:
    """Return explainable, rule-based recommendations for the selected disease."""

    normalized = {str(key).lower(): value for key, value in features.items()}
    recommendations: list[str] = []

    if disease == "diabetes":
        glucose = float(normalized.get("glucose", normalized.get("avg_glucose_level", 0)) or 0)
        bmi = float(normalized.get("bmi", 0) or 0)
        age = float(normalized.get("age", 0) or 0)
        if glucose >= 126:
            recommendations.append("Recommend HbA1c testing and physician review because glucose is elevated.")
        elif glucose >= 100:
            recommendations.append("Recommend lifestyle counselling and periodic glucose monitoring.")
        if bmi >= 30:
            recommendations.append("Recommend weight management, exercise, and dietary review because BMI is high.")
        if age >= 45:
            recommendations.append("Recommend routine metabolic screening because age increases long-term risk.")

    elif disease == "hypertension":
        bp = float(normalized.get("trestbps", normalized.get("blood_pressure", 0)) or 0)
        chol = float(normalized.get("chol", normalized.get("highchol", 0)) or 0)
        age = float(normalized.get("age", 0) or 0)
        bmi = float(normalized.get("bmi", 0) or 0)
        if bp >= 140:
            recommendations.append("Recommend physician review and repeat blood pressure checks.")
        elif bp >= 130:
            recommendations.append("Recommend lifestyle modification and home blood pressure monitoring.")
        if chol >= 240:
            recommendations.append("Recommend lipid assessment because cholesterol is high.")
        if bmi >= 30:
            recommendations.append("Recommend exercise and nutrition counselling because BMI is elevated.")
        if age >= 60:
            recommendations.append("Recommend regular cardiovascular monitoring because age increases risk.")

    elif disease == "stroke":
        age = float(normalized.get("age", 0) or 0)
        hypertension = float(normalized.get("hypertension", normalized.get("highbp", 0)) or 0)
        heart_disease = float(normalized.get("heart_disease", normalized.get("heartdiseaseorattack", 0)) or 0)
        glucose = float(normalized.get("avg_glucose_level", normalized.get("glucose", 0)) or 0)
        bmi = float(normalized.get("bmi", 0) or 0)
        smoking_status = float(normalized.get("smoking_status", normalized.get("smoker", 0)) or 0)
        if age >= 60:
            recommendations.append("Recommend routine neurological and vascular monitoring because age increases stroke risk.")
        if hypertension >= 1:
            recommendations.append("Recommend blood pressure control because hypertension strongly increases stroke risk.")
        if heart_disease >= 1:
            recommendations.append("Recommend cardiology follow-up because heart disease is a stroke risk factor.")
        if glucose >= 140:
            recommendations.append("Recommend glucose control and diabetes screening because hyperglycaemia raises stroke risk.")
        if bmi >= 30:
            recommendations.append("Recommend weight reduction and exercise because obesity raises vascular risk.")
        if smoking_status >= 1:
            recommendations.append("Recommend smoking cessation support because smoking is a modifiable stroke risk factor.")

    if not recommendations:
        recommendations.append("Continue routine monitoring and reinforce healthy lifestyle measures.")

    return recommendations


def preventive_measures_for_disease(disease: str, features: dict[str, Any]) -> list[str]:
    """Return preventive advice separate from the model prediction itself."""

    advice = OrderedDict()
    advice["diet"] = "Maintain a balanced diet with controlled salt, sugar, and processed food intake."
    advice["activity"] = "Encourage regular physical activity suited to the patient's clinical condition."
    advice["follow_up"] = "Schedule follow-up visits for repeat assessment and early intervention."

    if disease == "stroke":
        advice["smoking"] = "Support smoking cessation because it directly reduces vascular risk."
    if disease == "diabetes":
        advice["glucose"] = "Monitor glucose regularly and consider HbA1c review when indicated."

    return list(advice.values())


def explain_prediction(bundle, transformed_row) -> list[dict[str, float | str]]:
    """Expose the strongest model features for defense-ready explainability."""

    if not hasattr(bundle.estimator, "feature_importances_"):
        return []

    importances = getattr(bundle.estimator, "feature_importances_", None)
    if importances is None:
        return []

    feature_names = bundle.transformed_feature_names or bundle.feature_names
    pairs = sorted(zip(feature_names, importances), key=lambda item: item[1], reverse=True)
    return [{"feature": name, "importance": round(float(score), 4)} for name, score in pairs[:8]]
