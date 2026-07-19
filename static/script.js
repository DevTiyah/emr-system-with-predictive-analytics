const appState = {
    patients: [],
    dashboard: {},
    analytics: {},
    activePatient: null,
};

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function initials(name) {
    return String(name || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function riskClass(risk) {
    return risk === 'High' ? 'red' : risk === 'Moderate' ? 'amber' : 'green';
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setHTML(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = value;
    }
}

function patientRow(patient) {
    return `<tr>
        <td><div class="patient-cell"><span class="mini-avatar">${escapeHtml(initials(patient.name))}</span><strong>${escapeHtml(patient.name)}</strong></div></td>
        <td>${escapeHtml(patient.id)}</td>
        <td>${escapeHtml(patient.age)} / ${escapeHtml(patient.sex ? patient.sex[0] : '')}</td>
        <td>${escapeHtml(patient.last || '')}</td>
        <td>${escapeHtml(patient.condition || '')}</td>
        <td><span class="status ${riskClass(patient.risk)}"><i class="risk-dot"></i>${escapeHtml(patient.risk)}</span></td>
        <td><button class="btn small" onclick="openProfile('${patient.id}')">View</button></td>
    </tr>`;
}

function renderPatients() {
    const searchElement = document.getElementById('patient-search');
    const riskFilter = document.getElementById('risk-filter');
    const table = document.getElementById('patients-table');

    if (!searchElement || !riskFilter || !table) {
        return;
    }

    const query = searchElement.value.toLowerCase();
    const risk = riskFilter.value;
    const rows = appState.patients.filter((patient) => {
        const searchable = `${patient.name} ${patient.id} ${patient.phone}`.toLowerCase();
        return searchable.includes(query) && (risk === 'all' || patient.risk === risk);
    });

    table.innerHTML = rows.length
        ? rows.map(patientRow).join('')
        : '<tr><td colspan="7" class="empty">No matching patients found.</td></tr>';
}

function renderAttention() {
    const table = document.getElementById('attention-table');
    if (!table) {
        return;
    }

    const rows = appState.patients
        .filter((patient) => patient.risk === 'High' || String(patient.alert || '').toLowerCase().includes('glucose'))
        .slice(0, 4);

    table.innerHTML = rows.length
        ? rows.map((patient) => `<tr>
            <td><div class="patient-cell"><span class="mini-avatar">${escapeHtml(initials(patient.name))}</span><strong>${escapeHtml(patient.name)}</strong></div></td>
            <td>${escapeHtml(patient.last || '')}</td>
            <td><span class="tag">${escapeHtml(patient.alert || '')}</span></td>
            <td><span class="status ${riskClass(patient.risk)}"><i class="risk-dot"></i>${escapeHtml(patient.risk)} risk</span></td>
            <td><button class="btn small" onclick="openProfile('${patient.id}')">Review</button></td>
        </tr>`).join('')
        : '<tr><td colspan="5" class="empty">No patients currently require attention.</td></tr>';
}

function renderDashboard() {
    const dashboard = appState.dashboard || {};
    setText('total-patients', dashboard.total_patients ?? '0');
    setText('visits-this-month', dashboard.visits_this_month ?? '0');
    setText('high-risk-patients', dashboard.high_risk_patients ?? '0');
    setText('readmission-rate', `${dashboard.readmission_rate ?? 0}%`);

    const patientCount = appState.patients.length;
    const visitTrend = dashboard.visit_trends || { labels: [], values: [] };
    const trendMax = Math.max(1, ...visitTrend.values);
    const chartPoints = visitTrend.labels.length
        ? visitTrend.labels.map((label, index) => ({
            label,
            value: visitTrend.values[index] || 0,
            width: Math.max(12, Math.round(((visitTrend.values[index] || 0) / trendMax) * 100)),
        }))
        : [];

    const chartCaption = chartPoints.map((point) => `${point.label}: ${point.value}`).join(' · ');
    const chartTarget = document.querySelector('.chart .line-chart');
    if (chartTarget && chartCaption) {
        chartTarget.setAttribute('aria-label', chartCaption);
    }

    const attentionMetric = document.querySelector('.metric-note.neutral');
    if (attentionMetric && patientCount) {
        attentionMetric.textContent = `${dashboard.high_risk_patients ?? 0} of ${patientCount} patients need review`;
    }
}

function renderAnalytics() {
    const analytics = appState.analytics || {};
    setText('hypertension-cases', analytics.hypertension_cases ?? '0');
    setText('diabetes-cases', analytics.diabetes_cases ?? '0');
    setText('stroke-cases', analytics.stroke_cases ?? '0');
    setText('high-risk-cohort', analytics.high_risk_cohort ?? '0');
    const avgAge = Number(analytics.average_age || 0).toFixed(1);
    setText('average-age', `${avgAge} years`);
}

function renderVisitOptions() {
    const select = document.getElementById('visit-patient');
    if (!select) {
        return;
    }

    select.innerHTML = appState.patients
        .map((patient) => `<option value="${escapeHtml(patient.id)}">${escapeHtml(patient.name)} — ${escapeHtml(patient.id)}</option>`)
        .join('');

    if (appState.activePatient) {
        select.value = appState.activePatient.id;
    }
}

function renderRiskBreakdown(patient) {
    const container = document.getElementById('risk-breakdown');
    if (!container || !patient) {
        return;
    }

    const glucose = Number(patient.glucose || 0);
    const bmi = Number(patient.bmi || 0);
    const age = Number(patient.age || 0);

    const rows = [
        {
            label: 'Blood pressure',
            width: patient.risk === 'High' ? 78 : patient.risk === 'Moderate' ? 52 : 24,
            statusClass: riskClass(patient.risk),
            statusText: `${escapeHtml(patient.risk)} ${escapeHtml(patient.blood_pressure || 'N/A')}`,
        },
        {
            label: 'Glucose',
            width: Math.min(100, Math.round(glucose / 2)),
            statusClass: glucose >= 160 ? 'red' : glucose >= 126 ? 'amber' : 'green',
            statusText: glucose ? `${glucose} mg/dL` : 'N/A',
        },
        {
            label: 'Readmission',
            width: patient.risk === 'High' ? 70 : patient.risk === 'Moderate' ? 45 : 18,
            statusClass: patient.risk === 'High' ? 'red' : patient.risk === 'Moderate' ? 'amber' : 'green',
            statusText: `${escapeHtml(patient.risk)} risk`,
        },
    ];

    container.innerHTML = rows.map((row) => `<div class="risk-row"><span>${escapeHtml(row.label)}</span><div class="bar ${row.statusClass === 'red' ? 'red' : row.statusClass === 'amber' ? 'amber' : ''}"><span style="width:${row.width}%"></span></div><strong class="status ${row.statusClass}">${row.statusText}</strong></div>`).join('');

    const lastUpdate = document.getElementById('profile-last-update');
    if (lastUpdate) {
        lastUpdate.textContent = patient.last || '—';
    }

    const alerts = [];
    if (patient.alert) {
        alerts.push({ text: patient.alert, highlight: patient.risk === 'High' || String(patient.alert).includes('BP') });
    }
    if (bmi >= 30) {
        alerts.push({ text: `BMI of ${bmi.toFixed(1)} falls within the obese range. Lifestyle counselling recommended.`, highlight: false });
    }
    if (glucose >= 126) {
        alerts.push({ text: `Glucose is elevated at ${glucose} mg/dL. Follow-up testing is recommended.`, highlight: true });
    }
    if (age >= 60) {
        alerts.push({ text: 'Patient age increases the likelihood of chronic disease complications.', highlight: false });
    }

    const alertContainer = document.getElementById('clinical-alerts');
    if (alertContainer) {
        alertContainer.innerHTML = alerts.length
            ? alerts.map((alert) => `<div class="alert ${alert.highlight ? 'red' : ''}">${escapeHtml(alert.text)}</div>`).join('')
            : '<div class="alert">No active clinical alerts for this patient.</div>';
    }
}

function renderProfile(patient) {
    if (!patient) {
        return;
    }

    appState.activePatient = patient;

    setText('profile-initials', initials(patient.name));
    setText('profile-name', patient.name || 'Patient');
    setText('profile-details', `${patient.sex || 'Unknown'} · ${patient.age || '-'} years · ${patient.id || ''}`);
    setText('profile-phone', patient.phone || '—');
    setText('profile-last', patient.last || '—');

    const timeline = document.getElementById('timeline');
    if (timeline) {
        const events = Array.isArray(patient.timeline) ? patient.timeline : [];
        timeline.innerHTML = events.length
            ? events.map((event) => `<div class="event"><time>${escapeHtml(event.date || '')}</time><h3>${escapeHtml(event.title || 'Visit')}</h3><p>${escapeHtml(event.description || '')}</p></div>`).join('')
            : '<div class="event"><time>—</time><h3>No history available</h3><p>No visits have been recorded for this patient yet.</p></div>';
    }

    renderRiskBreakdown(patient);
}

function showPage(id) {
    document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === id));
    document.querySelectorAll('.nav button').forEach((button) => button.classList.toggle('active', button.dataset.page === id));
    const labels = {
        dashboard: 'Dashboard',
        patients: 'Patients',
        profile: 'Patient profile',
        visit: 'New clinical visit',
        appointments: 'Appointments',
        analytics: 'Analytics',
        reports: 'Reports',
        users: 'Users',
        settings: 'Settings',
    };
    setText('crumb', labels[id] || id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (id === 'patients') {
        renderPatients();
    }

    if (id === 'visit') {
        renderVisitOptions();
    }
}

async function openProfile(id) {
    try {
        const response = await fetch(`/api/patients/${encodeURIComponent(id)}`);
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Patient details could not be loaded.');
            return;
        }

        renderProfile(data.patient);
        showPage('profile');
    } catch (error) {
        console.error(error);
        alert('Patient details could not be loaded.');
    }
}

function calculateBMI() {
    const weightElement = document.getElementById('weight');
    const heightElement = document.getElementById('height');
    const bmiElement = document.getElementById('bmi');

    if (!weightElement || !heightElement || !bmiElement) {
        return;
    }

    const weight = Number(weightElement.value);
    const height = Number(heightElement.value) / 100;
    if (!weight || !height) {
        return;
    }

    const bmi = weight / (height * height);
    const label = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese';
    bmiElement.textContent = `${bmi.toFixed(1)} kg/m² · ${label}`;
}

async function saveVisit(event) {
    event.preventDefault();

    const payload = {
        patient_code: document.getElementById('visit-patient')?.value,
        visit_type: document.getElementById('visit-type')?.value,
        weight: document.getElementById('weight')?.value,
        height: document.getElementById('height')?.value,
        blood_pressure: document.getElementById('bp')?.value,
        glucose: document.getElementById('glucose')?.value,
        pulse: document.getElementById('pulse')?.value,
        diagnosis: document.getElementById('diagnosis')?.value,
        medication: document.getElementById('medication')?.value,
        notes: document.getElementById('notes')?.value,
    };

    try {
        const response = await fetch('/api/visits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Visit could not be saved.');
            return;
        }

        await loadState(data.patient?.id);
        renderProfile(data.patient);
        showPage('profile');
        alert('Visit saved. Risk assessment updated from the SQLite record.');
    } catch (error) {
        console.error(error);
        alert('Visit could not be saved.');
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) {
        return;
    }

    modal.classList.add('open');
    const nameField = document.getElementById('new-name');
    if (nameField) {
        nameField.focus();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('open');
    }
}

async function registerPatient(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById('new-name')?.value,
        phone: document.getElementById('new-phone')?.value,
        age: document.getElementById('new-age')?.value,
        sex: document.getElementById('new-sex')?.value,
    };

    try {
        const response = await fetch('/api/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Patient could not be registered.');
            return;
        }

        closeModal('patient-modal');
        event.target.reset();
        await loadState(data.patient?.id);
        renderProfile(data.patient);
        showPage('profile');
    } catch (error) {
        console.error(error);
        alert('Patient could not be registered.');
    }
}

async function loadState(preferredPatientId = null) {
    const response = await fetch('/api/bootstrap');
    const data = await response.json();

    appState.patients = data.patients || [];
    appState.dashboard = data.dashboard || {};
    appState.analytics = data.analytics || {};
    appState.activePatient = data.active_patient || appState.patients[0] || null;

    renderDashboard();
    renderAttention();
    renderPatients();
    renderAnalytics();
    renderVisitOptions();

    const activeId = preferredPatientId || data.active_patient?.id || appState.activePatient?.id;
    if (activeId) {
        const activePatient = appState.patients.find((patient) => patient.id === activeId);
        if (activePatient) {
            renderProfile(data.active_patient && data.active_patient.id === activeId ? data.active_patient : activePatient);
        }
    }
}

document.querySelectorAll('.nav button').forEach((button) => {
    button.addEventListener('click', () => showPage(button.dataset.page));
});

const modal = document.querySelector('.modal');
if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal('patient-modal');
        }
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadState();
        showPage('dashboard');
    } catch (error) {
        console.error(error);
    }
});