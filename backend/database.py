"""SQLite database layer built with SQLAlchemy.

The database is intentionally temporary and easy to migrate later. Using
SQLAlchemy keeps the schema portable when the project is moved from SQLite to
PostgreSQL for deployment.
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import date, timedelta
from typing import Iterator

from sqlalchemy import Float, Integer, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from backend.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[str] = mapped_column(String(24), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    last_visit: Mapped[str] = mapped_column(String(32), nullable=False)
    condition: Mapped[str] = mapped_column(String(120), nullable=False)
    risk: Mapped[str] = mapped_column(String(24), nullable=False)
    alert: Mapped[str] = mapped_column(String(255), nullable=False)
    glucose: Mapped[float | None] = mapped_column(Float, nullable=True)
    blood_pressure: Mapped[str | None] = mapped_column(String(32), nullable=True)
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    insulin: Mapped[float | None] = mapped_column(Float, nullable=True)


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_code: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    visit_type: Mapped[str] = mapped_column(String(120), nullable=False)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    blood_pressure: Mapped[str | None] = mapped_column(String(32), nullable=True)
    glucose: Mapped[float | None] = mapped_column(Float, nullable=True)
    pulse: Mapped[float | None] = mapped_column(Float, nullable=True)
    diagnosis: Mapped[str] = mapped_column(String(120), nullable=False)
    medication: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk: Mapped[str] = mapped_column(String(24), nullable=False)
    alert: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[str] = mapped_column(String(32), nullable=False)


@contextmanager
def session_scope() -> Iterator:
    """Provide a transactional session boundary."""

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """Create tables and seed a small demo dataset when the database is empty."""

    Base.metadata.create_all(engine)
    with session_scope() as session:
        count = session.scalar(select(func.count()).select_from(Patient)) or 0
        if count:
            return

        session.add_all(
            [
                Patient(
                    patient_code="PT-500",
                    name="Chinwe Adebayo",
                    age=52,
                    sex="Female",
                    phone="+234 803 123 2048",
                    last_visit=date.today().isoformat(),
                    condition="Essential hypertension",
                    risk="High",
                    alert="BP 154/96 mmHg",
                    glucose=142,
                    blood_pressure="154/96",
                    bmi=31.2,
                    insulin=88,
                ),
                Patient(
                    patient_code="PT-501",
                    name="Aminu Bello",
                    age=46,
                    sex="Male",
                    phone="+234 802 555 0192",
                    last_visit=date.today().isoformat(),
                    condition="Type 2 diabetes",
                    risk="Moderate",
                    alert="Glucose 118 mg/dL",
                    glucose=118,
                    blood_pressure="130/84",
                    bmi=28.4,
                    insulin=95,
                ),
                Patient(
                    patient_code="PT-502",
                    name="Nneka Okonkwo",
                    age=68,
                    sex="Female",
                    phone="+234 809 111 2233",
                    last_visit=date.today().isoformat(),
                    condition="Stroke follow-up",
                    risk="High",
                    alert="Age-related review due",
                    glucose=170,
                    blood_pressure="146/92",
                    bmi=30.8,
                    insulin=110,
                ),
            ]
        )
        session.add_all(
            [
                Visit(
                    patient_code="PT-500",
                    visit_type="Outpatient consultation",
                    weight=78,
                    height=158,
                    blood_pressure="154/96",
                    glucose=142,
                    pulse=84,
                    diagnosis="Essential hypertension",
                    medication="Amlodipine 5 mg once daily",
                    notes="Intermittent headache. Advised reduced sodium intake and review in four weeks.",
                    bmi=31.2,
                    risk="High",
                    alert="BP 154/96 mmHg",
                    created_at=date.today().isoformat(),
                ),
                Visit(
                    patient_code="PT-501",
                    visit_type="Follow-up",
                    weight=82,
                    height=171,
                    blood_pressure="130/84",
                    glucose=118,
                    pulse=78,
                    diagnosis="Diabetes review",
                    medication="Metformin continued",
                    notes="Dietary counselling reinforced.",
                    bmi=28.1,
                    risk="Moderate",
                    alert="Glucose 118 mg/dL",
                    created_at=date.today().isoformat(),
                ),
            ]
        )


def create_patient(name: str, age: int, sex: str, phone: str) -> str:
    """Insert a new patient while keeping the code generation transparent."""

    with session_scope() as session:
        last_code = session.scalars(select(Patient.patient_code).order_by(Patient.id.desc())).first()
        next_number = 500 if last_code is None else int(last_code.split("-")[1]) + 1
        patient = Patient(
            patient_code=f"PT-{next_number}",
            name=name,
            age=age,
            sex=sex,
            phone=phone,
            last_visit=date.today().isoformat(),
            condition="New registration",
            risk="Low",
            alert="New registration",
            glucose=None,
            blood_pressure=None,
            bmi=None,
            insulin=None,
        )
        session.add(patient)
        session.flush()
        return patient.patient_code


def list_patients() -> list[dict]:
    with session_scope() as session:
        patients = session.scalars(select(Patient).order_by(Patient.last_visit.desc(), Patient.name.asc())).all()
        return [patient_to_dict(patient) for patient in patients]


def get_patient_detail(patient_code: str) -> dict | None:
    with session_scope() as session:
        patient = session.scalar(select(Patient).where(Patient.patient_code == patient_code))
        if patient is None:
            return None
        visits = session.scalars(
            select(Visit).where(Visit.patient_code == patient_code).order_by(Visit.id.desc()).limit(10)
        ).all()
        patient_data = patient_to_dict(patient)
        patient_data["timeline"] = [visit_to_dict(visit) for visit in visits]
        return patient_data


def save_visit(
    payload: dict,
    *,
    risk: str,
    alert: str,
    bmi: float | None,
) -> dict:
    with session_scope() as session:
        patient = session.scalar(select(Patient).where(Patient.patient_code == payload["patient_code"]))
        if patient is None:
            raise ValueError("Selected patient was not found.")

        today = date.today().isoformat()
        visit = Visit(
            patient_code=patient.patient_code,
            visit_type=payload.get("visit_type") or "Outpatient consultation",
            weight=payload.get("weight"),
            height=payload.get("height"),
            blood_pressure=payload.get("blood_pressure"),
            glucose=payload.get("glucose"),
            pulse=payload.get("pulse"),
            diagnosis=payload.get("diagnosis") or "Clinical visit",
            medication=payload.get("medication"),
            notes=payload.get("notes"),
            bmi=bmi,
            risk=risk,
            alert=alert,
            created_at=today,
        )
        session.add(visit)
        patient.last_visit = today
        patient.condition = visit.diagnosis
        patient.risk = risk
        patient.alert = alert
        patient.glucose = payload.get("glucose")
        patient.blood_pressure = payload.get("blood_pressure")
        patient.bmi = bmi
        return patient_to_dict(patient)


def update_patient(patient_code: str, updates: dict) -> dict:
    """Apply partial updates to an existing patient record."""

    with session_scope() as session:
        patient = session.scalar(select(Patient).where(Patient.patient_code == patient_code))
        if patient is None:
            raise ValueError("Selected patient was not found.")

        allowed_fields = {
            "name",
            "age",
            "sex",
            "phone",
            "condition",
            "risk",
            "alert",
            "glucose",
            "blood_pressure",
            "bmi",
            "insulin",
        }
        for field_name, value in updates.items():
            if field_name in allowed_fields and value is not None:
                setattr(patient, field_name, value)

        return patient_to_dict(patient)


def patient_to_dict(patient: Patient) -> dict:
    return {
        "id": patient.patient_code,
        "name": patient.name,
        "age": patient.age,
        "sex": patient.sex,
        "phone": patient.phone,
        "last": patient.last_visit,
        "condition": patient.condition,
        "risk": patient.risk,
        "alert": patient.alert,
        "glucose": patient.glucose,
        "blood_pressure": patient.blood_pressure,
        "bmi": patient.bmi,
        "insulin": patient.insulin,
    }


def visit_to_dict(visit: Visit) -> dict:
    return {
        "date": visit.created_at,
        "title": visit.visit_type,
        "description": visit.notes or visit.diagnosis,
        "alert": visit.alert,
        "risk": visit.risk,
        "diagnosis": visit.diagnosis,
        "medication": visit.medication,
        "blood_pressure": visit.blood_pressure,
        "glucose": visit.glucose,
        "pulse": visit.pulse,
        "bmi": visit.bmi,
    }


def dashboard_summary() -> dict:
    with session_scope() as session:
        total_patients = session.scalar(select(func.count()).select_from(Patient)) or 0
        high_risk_patients = session.scalar(select(func.count()).select_from(Patient).where(Patient.risk == "High")) or 0
        visits_this_month = session.scalar(
            select(func.count()).select_from(Visit).where(func.substr(Visit.created_at, 1, 7) == func.strftime("%Y-%m", "now"))
        ) or 0
        readmission_rate = round((high_risk_patients / total_patients) * 100, 1) if total_patients else 0

        attention_patients = session.scalars(
            select(Patient)
            .where((Patient.risk == "High") | (Patient.alert.contains("Glucose")))
            .order_by(Patient.last_visit.desc())
            .limit(4)
        ).all()

        monthly_counts = {
            row[0]: row[1]
            for row in session.execute(
                select(func.substr(Visit.created_at, 1, 7), func.count()).group_by(func.substr(Visit.created_at, 1, 7))
            )
        }
        labels = []
        values = []
        today = date.today().replace(day=1)
        for month_offset in range(5, -1, -1):
            month = today
            for _ in range(month_offset):
                month = (month - timedelta(days=1)).replace(day=1)
            labels.append(month.strftime("%b"))
            values.append(monthly_counts.get(month.strftime("%Y-%m"), 0))

        condition_rows = session.execute(
            select(Patient.condition, func.count()).group_by(Patient.condition).order_by(func.count().desc()).limit(4)
        ).all()

        return {
            "total_patients": total_patients,
            "visits_this_month": visits_this_month,
            "high_risk_patients": high_risk_patients,
            "readmission_rate": readmission_rate,
            "attention_patients": [patient_to_dict(patient) for patient in attention_patients],
            "visit_trends": {"labels": labels, "values": values},
            "condition_distribution": [{"label": row[0], "value": row[1]} for row in condition_rows],
        }


def analytics_summary() -> dict:
    with session_scope() as session:
        hypertension_cases = session.scalar(select(func.count()).select_from(Patient).where(Patient.condition.ilike("%hypertension%"))) or 0
        diabetes_cases = session.scalar(select(func.count()).select_from(Patient).where(Patient.condition.ilike("%diabetes%"))) or 0
        stroke_cases = session.scalar(select(func.count()).select_from(Patient).where(Patient.condition.ilike("%stroke%"))) or 0
        high_risk_cohort = session.scalar(select(func.count()).select_from(Patient).where(Patient.risk == "High")) or 0
        average_age = session.scalar(select(func.round(func.avg(Patient.age), 1))) or 0
        gender_distribution = session.execute(select(Patient.sex, func.count()).group_by(Patient.sex)).all()
        monthly_visits = session.execute(
            select(func.substr(Visit.created_at, 1, 7), func.count()).group_by(func.substr(Visit.created_at, 1, 7))
        ).all()
        risk_distribution = session.execute(select(Patient.risk, func.count()).group_by(Patient.risk)).all()

        return {
            "hypertension_cases": hypertension_cases,
            "diabetes_cases": diabetes_cases,
            "stroke_cases": stroke_cases,
            "high_risk_cohort": high_risk_cohort,
            "average_age": float(average_age),
            "average_length_of_stay": float(average_age),
            "gender_distribution": [{"label": row[0], "value": row[1]} for row in gender_distribution],
            "monthly_visits": [{"label": row[0], "value": row[1]} for row in monthly_visits],
            "risk_distribution": [{"label": row[0], "value": row[1]} for row in risk_distribution],
        }
