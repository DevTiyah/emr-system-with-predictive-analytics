# EMR AI Predictive Analytics System

An integrated EMR (Electronic Medical Records) digitization and AI-powered
predictive analytics system for enhanced patient care in Nigeria.

## Features

1. **Disease Risk Prediction** — separate machine learning models predict
   **Diabetes**, **Hypertension**, and **Stroke** risk.
2. **Clinical Decision Support** — rule-based recommendations explain what
   to do after a high-risk prediction.
3. **Predictive Analytics Dashboard** — SQLite-backed patient records,
   visits, and analytics metrics are served through FastAPI.
4. **Explainability** — the backend returns feature values and feature
   importance when available.

## Project Structure

```
emr-flask-app/
├── main.py                # FastAPI application (routes, validation, predictions)
├── app.py                 # Compatibility wrapper for older entry points
├── train_models.py        # Trains diabetes, hypertension, and stroke models
├── saved_models/          # Generated model bundles, scalers, and reports
├── emr.sqlite3            # Auto-generated SQLite database for the EMR UI
├── datasets/              # Real Kaggle CSVs used for training
├── requirements.txt
├── Procfile
├── templates/
│   ├── index.html             # Patient data input form
│   └── result.html             # Prediction result page
└── static/
    └── style.css                # Blue/white medical UI theme
```

## Running Locally

1. **Create a virtual environment (recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate      # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **(Optional) Retrain the models:**

   The generated artifacts live in `saved_models/`. You can rebuild them at
   any time:

   ```bash
   python train_models.py
   ```

4. **Run the app:**

   ```bash
   uvicorn main:app --reload
   ```

   The app will be available at `http://127.0.0.1:8000`.

   On first launch, the SQLite database is created automatically and seeded
   with demo patients and visits for the dashboard.

5. **Run with Uvicorn in production-style mode:**

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Deploying on Render

1. Push this project to a GitHub repository.
2. Log in to [Render](https://render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**. Render will install dependencies and start
   the app using the `Procfile`/start command automatically.
6. Once deployed, Render will give you a public URL (e.g.
   `https://emr-flask-app.onrender.com`) where the app is live.

## Deploying on Heroku

1. Install the Heroku CLI and log in: `heroku login`
2. From the project folder:

   ```bash
   heroku create emr-flask-app
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

3. Heroku will detect the `Procfile` and start the app with Uvicorn.

## API Endpoints

- `POST /predict/diabetes`
- `POST /predict/hypertension`
- `POST /predict/stroke`
- `POST /patient`
- `GET /patient/{id}`
- `POST /visit`
- `GET /dashboard`
- `GET /analytics`
- `GET /docs`

## Sample Input for Testing

### Example 1 — Likely "High Risk"

| Field          | Value |
|-----------------|-------|
| Age             | 58    |
| Glucose         | 165   |
| Blood Pressure  | 145   |
| BMI             | 33.5  |
| Insulin         | 190   |

### Example 2 — Likely "Low Risk"

| Field          | Value |
|-----------------|-------|
| Age             | 28    |
| Glucose         | 88    |
| Blood Pressure  | 72    |
| BMI             | 22.0  |
| Insulin         | 45    |

## Important Disclaimer

This application is a **demonstration / educational tool**. The models are
trained on real Kaggle CSV datasets and the clinical suggestions are
generated using explainable rule-based logic. It is **not** a certified
medical device and must **not** be used as a substitute for professional
medical advice, diagnosis, or treatment.
