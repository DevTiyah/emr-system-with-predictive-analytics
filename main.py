"""FastAPI application for the EMR predictive analytics system."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from backend import database
from backend.config import BASE_DIR, DISEASE_SPECS
from backend.data_utils import normalize_payload_keys
from backend.prediction_service import predict
from backend.schemas import PatientCreate, PatientUpdate, PredictionRequest, PredictionResponse, VisitCreate

app = FastAPI(
    title="EMR AI Predictive Analytics System",
    description="FastAPI backend for disease risk prediction, clinical decision support, and EMR analytics.",
    version="2.0.0",
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize the temporary SQLite database before the API starts."""

    database.init_db()
    yield


app.router.lifespan_context = lifespan

TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse, name="index")
def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/bootstrap")
def api_bootstrap() -> dict[str, Any]:
    patients = database.list_patients()
    active_patient = database.get_patient_detail(patients[0]["id"]) if patients else None
    return {
        "dashboard": database.dashboard_summary(),
        "analytics": database.analytics_summary(),
        "patients": patients,
        "active_patient": active_patient,
        "visit_options": [
            {"value": patient["id"], "label": f"{patient['name']} — {patient['id']}"}
            for patient in patients
        ],
    }


@app.post("/api/patients", status_code=201)
def api_create_patient(payload: PatientCreate) -> dict[str, Any]:
    patient_code = database.create_patient(payload.name.strip(), payload.age, payload.sex.strip(), payload.phone.strip())
    detail = database.get_patient_detail(patient_code)
    return {"patient": detail}


@app.post("/patient", status_code=201)
def create_patient(payload: PatientCreate) -> dict[str, Any]:
    """Alias for the patient creation endpoint expected by the project spec."""

    return api_create_patient(payload)


@app.get("/api/patients/{patient_code}")
def api_patient_detail(patient_code: str) -> dict[str, Any]:
    patient = database.get_patient_detail(patient_code)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return {"patient": patient}


@app.get("/patient/{patient_code}")
def get_patient(patient_code: str) -> dict[str, Any]:
    """Alias for fetching a single patient record."""

    return api_patient_detail(patient_code)


@app.patch("/patient/{patient_code}")
def update_patient(patient_code: str, payload: PatientUpdate) -> dict[str, Any]:
    """Update an existing patient record for functional EMR workflows."""

    try:
        updated = database.update_patient(patient_code, payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"patient": updated}


@app.post("/api/visits")
def api_save_visit(payload: VisitCreate) -> dict[str, Any]:
    visit_data = payload.model_dump()
    normalized = normalize_payload_keys({key: value for key, value in visit_data.items() if value is not None})
    bmi = None
    if normalized.get("weight") and normalized.get("height"):
        height_m = float(normalized["height"]) / 100
        if height_m > 0:
            bmi = round(float(normalized["weight"]) / (height_m * height_m), 1)

    risk = "Low"
    alert = "Routine follow-up"
    if normalized.get("glucose") and float(normalized["glucose"]) >= 160:
        risk = "High"
        alert = f"Glucose {float(normalized['glucose'])} mg/dL"
    elif normalized.get("blood_pressure"):
        risk = "Moderate"
        alert = f"BP {normalized['blood_pressure']}"

    if not payload.patient_code:
        raise HTTPException(status_code=400, detail="Patient selection is required.")

    try:
        patient = database.save_visit(visit_data, risk=risk, alert=alert, bmi=bmi)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"patient": database.get_patient_detail(patient["id"])}


@app.post("/visit")
def create_visit(payload: VisitCreate) -> dict[str, Any]:
    """Alias for the visit creation endpoint expected by the project spec."""

    return api_save_visit(payload)


@app.get("/dashboard")
def dashboard() -> dict[str, Any]:
    return database.dashboard_summary()


@app.get("/analytics")
def analytics() -> dict[str, Any]:
    return database.analytics_summary()


def _predict_disease(disease: str, payload: PredictionRequest) -> dict[str, Any]:
    try:
        return predict(disease, payload.features)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/predict/diabetes", response_model=PredictionResponse)
def predict_diabetes(payload: PredictionRequest) -> dict[str, Any]:
    return _predict_disease("diabetes", payload)


@app.post("/predict/hypertension", response_model=PredictionResponse)
def predict_hypertension(payload: PredictionRequest) -> dict[str, Any]:
    return _predict_disease("hypertension", payload)


@app.post("/predict/stroke", response_model=PredictionResponse)
def predict_stroke(payload: PredictionRequest) -> dict[str, Any]:
    return _predict_disease("stroke", payload)


@app.post("/predict")
def legacy_predict(_request: Request) -> JSONResponse:
    raise HTTPException(status_code=400, detail="Use /predict/diabetes, /predict/hypertension, or /predict/stroke.")


@app.exception_handler(404)
def not_found(_request: Request, _exc: Exception):
    return JSONResponse(status_code=404, content={"detail": "The requested page was not found."})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
