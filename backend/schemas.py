"""Pydantic schemas used by the FastAPI layer."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    name: str
    age: int
    sex: str
    phone: str


class PatientUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    sex: str | None = None
    phone: str | None = None
    condition: str | None = None
    risk: str | None = None
    alert: str | None = None
    glucose: float | None = None
    blood_pressure: str | None = None
    bmi: float | None = None
    insulin: float | None = None


class VisitCreate(BaseModel):
    patient_code: str
    visit_type: str = "Outpatient consultation"
    weight: float | None = None
    height: float | None = None
    blood_pressure: str | None = None
    glucose: float | None = None
    pulse: float | None = None
    diagnosis: str | None = None
    medication: str | None = None
    notes: str | None = None


class PredictionRequest(BaseModel):
    features: dict[str, Any] = Field(default_factory=dict)


class PredictionResponse(BaseModel):
    disease: str
    prediction: str
    probability: float
    confidence: str
    risk_level: str
    recommendations: list[str]
    preventive_measures: list[str]
    feature_values_used: dict[str, Any]
    feature_importance: list[dict[str, Any]] = Field(default_factory=list)
    model_features: list[str] = Field(default_factory=list)
