# Dashboard Analysis

## Dashboard Purpose

The dashboard is the main operations view for the EMR system. It summarizes patient volume, risk, disease burden, and active clinical attention items using the data returned by `/api/bootstrap`.

## Cards and Metrics

The dashboard metrics at the top of the page are:

- Total patients
- High risk patients
- Diabetes cases
- Hypertension cases
- Stroke cases
- Today’s visits

These values are populated in `static/script.js` from `appState.dashboard` and `appState.analytics`.

## Charts

### Monthly Visits Line Chart

- HTML container: `.dashboard-line-chart`
- Renderer: `renderDashboardLineChart(labels, values)`
- Data source: `dashboard.visit_trends` from `/api/bootstrap`

### Disease Distribution Donut Chart

- HTML container: `.dashboard-donut`
- Renderer: `renderDashboardConditionDistribution(distribution)`
- Data source: `dashboard.condition_distribution`

### Risk Distribution

- HTML container: `#risk-distribution-list`
- Renderer: `renderDashboardRiskDistribution(distribution)`
- Data source: `analytics.risk_distribution`

### Gender Distribution Bars

- HTML container: `#gender-bars`
- Renderer: `renderDashboardGenderBars(distribution)`
- Data source: `analytics.gender_distribution`

### Alerts Panel

- HTML container: `#dashboard-alerts`
- Renderer: `renderDashboardAlerts()`
- Data source: dashboard summary and patient list

## Tables

The dashboard attention table is filled from `dashboard.attention_patients` and shows:

- patient name
- last visit
- clinical alert
- risk assessment

## Data Sources

- `/api/bootstrap`
- `backend.database.dashboard_summary()`
- `backend.database.analytics_summary()`

## How Every Chart Is Generated

| Visual | Generator | Underlying data |
|---|---|---|
| Line chart | SVG path rendering in `renderDashboardLineChart()` | `visit_trends.labels` and `visit_trends.values` |
| Donut chart | CSS `conic-gradient` in `renderDashboardConditionDistribution()` | `condition_distribution` |
| Risk bars | DOM rows in `renderDashboardRiskDistribution()` | `risk_distribution` |
| Gender bars | DOM bars in `renderDashboardGenderBars()` | `gender_distribution` |
| Alerts | HTML cards from `renderDashboardAlerts()` | dashboard summary and patient alerts |
