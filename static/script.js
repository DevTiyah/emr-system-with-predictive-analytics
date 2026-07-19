const appState = {
    patients: [],
    dashboard: {},
    analytics: {},
    activePatient: null,
    patientList: {
        page: 1,
        pageSize: 5,
        totalPages: 1,
        filtered: [],
        filters: {},
    },
};

const PREDICTION_HISTORY_KEY = 'emrPredictionHistory';
const UI_SETTINGS_KEY = 'emrUiSettings';

const DEFAULT_UI_SETTINGS = {
    facilityName: 'General Hospital',
    facilityLocation: 'Lagos, Nigeria',
    facilityWard: 'Outpatient clinic',
    facilityContact: '+234 800 000 0000',
    analyticsRange: 'Last 6 months',
    predictionProfile: 'active',
    reportFormat: 'csv',
    sidebarMode: 'expanded',
    savedAt: null,
};

const PREDICTION_CONFIGS = {
    diabetes: {
        title: 'Diabetes inputs',
        endpoint: '/predict/diabetes',
        fields: [
            { name: 'age', label: 'Age', type: 'number', step: '1', placeholder: 'e.g. 45' },
            { name: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Female', value: '0' }, { label: 'Male', value: '1' }] },
            { name: 'highchol', label: 'High cholesterol', type: 'select', options: yesNoOptions() },
            { name: 'cholcheck', label: 'Cholesterol checked', type: 'select', options: yesNoOptions() },
            { name: 'bmi', label: 'BMI', type: 'number', step: '0.1', placeholder: 'e.g. 28.4' },
            { name: 'smoker', label: 'Current smoker', type: 'select', options: yesNoOptions() },
            { name: 'heartdiseaseorattack', label: 'Heart disease or attack', type: 'select', options: yesNoOptions() },
            { name: 'physactivity', label: 'Physical activity', type: 'select', options: yesNoOptions() },
            { name: 'fruits', label: 'Consumes fruits regularly', type: 'select', options: yesNoOptions() },
            { name: 'veggies', label: 'Consumes vegetables regularly', type: 'select', options: yesNoOptions() },
            { name: 'hvyalcoholconsump', label: 'Heavy alcohol consumption', type: 'select', options: yesNoOptions() },
            { name: 'genhlth', label: 'General health score', type: 'number', step: '1', placeholder: '1-5' },
            { name: 'menthlth', label: 'Mental health days', type: 'number', step: '1', placeholder: '0-30' },
            { name: 'physhlth', label: 'Physical health days', type: 'number', step: '1', placeholder: '0-30' },
            { name: 'diffwalk', label: 'Difficulty walking', type: 'select', options: yesNoOptions() },
            { name: 'stroke', label: 'History of stroke', type: 'select', options: yesNoOptions() },
            { name: 'highbp', label: 'High blood pressure', type: 'select', options: yesNoOptions() },
        ],
        defaults(patient) {
            const bloodPressure = parseBloodPressure(patient?.blood_pressure || '120/80');
            return {
                age: patient?.age ?? 45,
                sex: patient?.sex?.toLowerCase().startsWith('m') ? '1' : '0',
                highchol: '0',
                cholcheck: '1',
                bmi: patient?.bmi ?? 27.5,
                smoker: '0',
                heartdiseaseorattack: '0',
                physactivity: '1',
                fruits: '1',
                veggies: '1',
                hvyalcoholconsump: '0',
                genhlth: '3',
                menthlth: '2',
                physhlth: '2',
                diffwalk: '0',
                stroke: String(String(patient?.condition || '').toLowerCase().includes('stroke') ? 1 : 0),
                highbp: String(bloodPressure.systolic >= 130 || String(patient?.risk || '').toLowerCase() === 'high' ? 1 : 0),
            };
        },
    },
    hypertension: {
        title: 'Hypertension inputs',
        endpoint: '/predict/hypertension',
        fields: [
            { name: 'age', label: 'Age', type: 'number', step: '1', placeholder: 'e.g. 57' },
            { name: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Female', value: '0' }, { label: 'Male', value: '1' }] },
            { name: 'cp', label: 'Chest pain type', type: 'number', step: '1', placeholder: '0-3' },
            { name: 'trestbps', label: 'Resting blood pressure', type: 'number', step: '1', placeholder: 'e.g. 145' },
            { name: 'chol', label: 'Serum cholesterol', type: 'number', step: '1', placeholder: 'e.g. 233' },
            { name: 'fbs', label: 'Fasting blood sugar > 120 mg/dL', type: 'select', options: yesNoOptions() },
            { name: 'restecg', label: 'Resting ECG', type: 'number', step: '1', placeholder: '0-2' },
            { name: 'thalach', label: 'Max heart rate achieved', type: 'number', step: '1', placeholder: 'e.g. 150' },
            { name: 'exang', label: 'Exercise induced angina', type: 'select', options: yesNoOptions() },
            { name: 'oldpeak', label: 'Oldpeak', type: 'number', step: '0.1', placeholder: 'e.g. 2.3' },
            { name: 'slope', label: 'Slope', type: 'number', step: '1', placeholder: '0-2' },
            { name: 'ca', label: 'Major vessels colored', type: 'number', step: '1', placeholder: '0-4' },
            { name: 'thal', label: 'Thal', type: 'number', step: '1', placeholder: '0-3' },
        ],
        defaults(patient) {
            const bloodPressure = parseBloodPressure(patient?.blood_pressure || '145/90');
            return {
                age: patient?.age ?? 57,
                sex: patient?.sex?.toLowerCase().startsWith('m') ? '1' : '0',
                cp: '2',
                trestbps: bloodPressure.systolic || 145,
                chol: patient?.glucose ? Math.round(Number(patient.glucose) + 90) : 233,
                fbs: String((patient?.glucose || 0) >= 126 ? 1 : 0),
                restecg: '0',
                thalach: '150',
                exang: '0',
                oldpeak: '2.0',
                slope: '1',
                ca: '0',
                thal: '1',
            };
        },
    },
    stroke: {
        title: 'Stroke inputs',
        endpoint: '/predict/stroke',
        fields: [
            { name: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Female', value: '0' }, { label: 'Male', value: '1' }] },
            { name: 'age', label: 'Age', type: 'number', step: '1', placeholder: 'e.g. 63' },
            { name: 'hypertension', label: 'Hypertension history', type: 'select', options: yesNoOptions() },
            { name: 'heart_disease', label: 'Heart disease', type: 'select', options: yesNoOptions() },
            { name: 'ever_married', label: 'Ever married', type: 'select', options: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }] },
            { name: 'work_type', label: 'Work type', type: 'select', options: [
                { label: 'Private', value: '1' },
                { label: 'Self-employed', value: '2' },
                { label: 'Children', value: '3' },
                { label: 'Govt job', value: '4' },
                { label: 'Never worked', value: '0' },
            ] },
            { name: 'residence_type', label: 'Residence type', type: 'select', options: [{ label: 'Rural', value: '0' }, { label: 'Urban', value: '1' }] },
            { name: 'avg_glucose_level', label: 'Average glucose level', type: 'number', step: '0.1', placeholder: 'e.g. 105.9' },
            { name: 'bmi', label: 'BMI', type: 'number', step: '0.1', placeholder: 'e.g. 32.5' },
            { name: 'smoking_status', label: 'Smoking status', type: 'select', options: [
                { label: 'Never smoked', value: '0' },
                { label: 'Formerly smoked', value: '1' },
                { label: 'Smokes', value: '2' },
                { label: 'Unknown', value: '3' },
            ] },
        ],
        defaults(patient) {
            return {
                sex: patient?.sex?.toLowerCase().startsWith('m') ? '1' : '0',
                age: patient?.age ?? 63,
                hypertension: String(String(patient?.risk || '').toLowerCase() === 'high' ? 1 : 0),
                heart_disease: '0',
                ever_married: '1',
                work_type: '1',
                residence_type: '1',
                avg_glucose_level: patient?.glucose ?? 105.9,
                bmi: patient?.bmi ?? 32.5,
                smoking_status: '0',
            };
        },
    },
};

function yesNoOptions() {
    return [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }];
}

const AUTH_STORAGE_KEY = 'emrAuthSession';

function getAuthSession() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function saveAuthSession(session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function titleCase(value) {
    return String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function deriveNameFromEmail(email) {
    const prefix = String(email || 'staff').split('@')[0].replace(/[._-]+/g, ' ');
    return titleCase(prefix || 'Hospital Staff');
}

function authToast(message, kind = 'success') {
    let toast = document.querySelector('.auth-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'auth-toast';
        document.body.appendChild(toast);
    }

    toast.className = `auth-toast ${kind}`;
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('show'));
    window.clearTimeout(window.__authToastTimer);
    window.__authToastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function applyRoleVisibility(role) {
    const normalizedRole = String(role || '').toLowerCase();
    const sections = document.querySelectorAll('.sidebar > div');

    sections.forEach((section) => {
        const label = section.querySelector('.workspace')?.textContent.trim().toLowerCase();
        if (label === 'administration') {
            section.classList.toggle('hidden', normalizedRole !== 'administrator');
        }
    });
}

function renderSessionChrome(session) {
    if (!session) {
        return;
    }

    const sidebarUser = document.querySelector('.sidebar .user');
    const sidebarAvatar = document.querySelector('.sidebar .user .avatar');
    if (sidebarUser) {
        const nameNode = sidebarUser.querySelector('strong');
        const roleNode = sidebarUser.querySelector('small');
        if (nameNode) {
            nameNode.textContent = session.name || 'Hospital Staff';
        }
        if (roleNode) {
            roleNode.textContent = `${session.role || 'Doctor'}${session.department ? ` · ${session.department}` : ''}`;
        }
    }

    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach((avatar) => {
        avatar.textContent = initials(session.name || session.email || 'HS');
    });

    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials(session.name || session.email || 'HS');
    }

    const topActions = document.querySelector('.top-actions');
    if (topActions && !topActions.querySelector('.session-chip')) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'session-chip';
        chip.innerHTML = `<span>${escapeHtml(session.role || 'Doctor')}</span><small>${escapeHtml(session.department || 'Clinical access')}</small>`;
        chip.addEventListener('click', () => {
            window.location.href = '/profile';
        });

        const profileButton = document.createElement('button');
        profileButton.type = 'button';
        profileButton.className = 'btn small';
        profileButton.textContent = 'Profile';
        profileButton.addEventListener('click', () => {
            window.location.href = '/profile';
        });

        const logoutButton = document.createElement('button');
        logoutButton.type = 'button';
        logoutButton.className = 'btn small danger';
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', () => {
            window.location.href = '/logout';
        });

        topActions.insertBefore(chip, topActions.firstChild);
        topActions.append(profileButton, logoutButton);
    }

    applyRoleVisibility(session.role);
}

function openSidebar() {
    document.body.classList.add('sidebar-open');
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
}

function requireSessionOrRedirect() {
    const session = getAuthSession();
    if (!session) {
        window.location.replace('/login');
        return null;
    }

    return session;
}

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

function formatNumber(value) {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function dashboardPalette(index) {
    const colors = ['#087e8b', '#4386c6', '#dd8d20', '#2e927d', '#c95f55', '#7c8ea1'];
    return colors[index % colors.length];
}

function renderDashboardLineChart(labels, values) {
    const svg = document.querySelector('.dashboard-line-chart');
    if (!svg) {
        return;
    }

    const safeLabels = Array.isArray(labels) ? labels : [];
    const safeValues = Array.isArray(values) ? values.map((value) => Number(value || 0)) : [];
    const points = safeValues.length ? safeValues : [0];
    const maxValue = Math.max(1, ...points);
    const width = 640;
    const height = 260;
    const padding = { left: 54, right: 28, top: 24, bottom: 40 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const step = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;

    const coordinates = points.map((value, index) => {
        const x = padding.left + (points.length === 1 ? plotWidth / 2 : index * step);
        const y = padding.top + plotHeight - ((value / maxValue) * plotHeight);
        return { x, y, value };
    });

    const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;
    const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + plotHeight * ratio;
        const value = Math.round(maxValue * (1 - ratio));
        return `<line class="gridline" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" /><text x="10" y="${y + 4}">${value}</text>`;
    }).join('');

    const labelNodes = coordinates.map((point, index) => {
        const label = safeLabels[index] || `M${index + 1}`;
        return `<text x="${point.x.toFixed(1)}" y="238" text-anchor="middle">${escapeHtml(label)}</text>`;
    }).join('');

    const pointNodes = coordinates.map((point) => `<circle class="point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" />`).join('');

    svg.innerHTML = `
        ${gridLines}
        <path class="area" d="${areaPath}" />
        <path class="line" d="${linePath}" />
        <g>${pointNodes}</g>
        ${labelNodes}
    `;

    const caption = coordinates.map((point, index) => `${safeLabels[index] || `Month ${index + 1}`}: ${point.value}`).join(' · ');
    svg.setAttribute('aria-label', caption || 'Monthly visits chart');
}

function renderDashboardConditionDistribution(distribution) {
    const donut = document.querySelector('.dashboard-donut');
    const key = document.getElementById('condition-key');
    if (!donut || !key) {
        return;
    }

    const items = Array.isArray(distribution) && distribution.length ? distribution : [{ label: 'No records', value: 1 }];
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
    let offset = 0;
    const slices = items.map((item, index) => {
        const percentage = (Number(item.value || 0) / total) * 100;
        const slice = `${dashboardPalette(index)} ${offset.toFixed(2)}% ${(offset + percentage).toFixed(2)}%`;
        offset += percentage;
        return slice;
    }).join(', ');

    donut.style.background = `conic-gradient(${slices})`;
    donut.dataset.center = `${formatNumber(total)}\ncases`;

    key.innerHTML = items.map((item, index) => `<span><i class="dot" style="background:${dashboardPalette(index)}"></i>${escapeHtml(item.label || 'Condition')} <strong>${formatNumber(item.value)}</strong></span>`).join('');
}

function renderDashboardRiskDistribution(distribution) {
    const container = document.getElementById('risk-distribution-list');
    if (!container) {
        return;
    }

    const items = Array.isArray(distribution) && distribution.length
        ? distribution
        : [{ label: 'Low', value: 0 }, { label: 'Moderate', value: 0 }, { label: 'High', value: 0 }];
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

    container.innerHTML = items.map((item) => {
        const value = Number(item.value || 0);
        const width = Math.max(10, Math.round((value / total) * 100));
        const statusClass = riskClass(item.label);
        const label = titleCase(item.label);
        return `<div class="risk-row"><span>${escapeHtml(label)}</span><div class="bar ${statusClass === 'red' ? 'red' : statusClass === 'amber' ? 'amber' : ''}"><span style="width:${width}%"></span></div><strong class="status ${statusClass}">${formatNumber(value)}</strong></div>`;
    }).join('');
}

function renderDashboardGenderBars(distribution) {
    const container = document.getElementById('gender-bars');
    if (!container) {
        return;
    }

    const items = Array.isArray(distribution) && distribution.length
        ? distribution
        : [{ label: 'Female', value: 0 }, { label: 'Male', value: 0 }];
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

    container.innerHTML = items.map((item, index) => {
        const value = Number(item.value || 0);
        const height = Math.max(18, Math.round((value / total) * 100));
        return `<div class="bar-col"><i style="height:${height}% ; background:${dashboardPalette(index)}"></i><span>${escapeHtml(item.label || 'Group')}</span><strong>${formatNumber(value)}</strong></div>`;
    }).join('');
}

function renderDashboardAlerts() {
    const container = document.getElementById('dashboard-alerts');
    if (!container) {
        return;
    }

    const dashboard = appState.dashboard || {};
    const analytics = appState.analytics || {};
    const attentionPatients = Array.isArray(dashboard.attention_patients) ? dashboard.attention_patients : [];
    const criticalPatients = attentionPatients.filter((patient) => patient.risk === 'High').slice(0, 2);
    const followUps = attentionPatients.slice(0, 3);
    const reminders = appState.patients.filter((patient) => String(patient.medication || '').trim()).slice(0, 2);
    const recentAdmissions = appState.patients.slice(0, 2);
    const upcomingAppointments = Math.max(1, Math.round((dashboard.visits_this_month || 0) * 0.12));

    const cards = [
        {
            title: 'Critical patients',
            count: criticalPatients.length || attentionPatients.length,
            tone: 'high',
            text: criticalPatients[0]
                ? `${criticalPatients[0].name} requires immediate clinical review.`
                : 'High-risk patients are being monitored by the AI triage queue.',
        },
        {
            title: 'AI alerts',
            count: analytics.high_risk_cohort ?? dashboard.high_risk_patients ?? 0,
            tone: 'amber',
            text: 'Prediction signals are aligned with elevated diabetes and hypertension risk.',
        },
        {
            title: 'Pending follow-ups',
            count: followUps.length,
            tone: 'blue',
            text: followUps.length
                ? `${followUps.map((patient) => patient.name).join(', ')} need follow-up review.`
                : 'No pending follow-up items at the moment.',
        },
        {
            title: 'Recent admissions',
            count: recentAdmissions.length,
            tone: 'blue',
            text: recentAdmissions.length
                ? `${recentAdmissions[0].name} is the latest active patient in the current queue.`
                : 'No recent admissions found in the current dataset.',
        },
        {
            title: 'Medication reminders',
            count: reminders.length,
            tone: 'amber',
            text: reminders.length
                ? `${reminders[0].name} has an active prescription reminder.`
                : 'No active medication reminders are due today.',
        },
        {
            title: 'Upcoming appointments',
            count: upcomingAppointments,
            tone: 'high',
            text: 'Schedule follow-up consultations for elevated-risk patients.',
        },
    ];

    container.innerHTML = cards.map((card) => `<article class="alert-card ${card.tone}"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p><strong>${formatNumber(card.count)}</strong></article>`).join('');
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
    const sexFilter = document.getElementById('sex-filter');
    const sortFilter = document.getElementById('sort-filter');
    const table = document.getElementById('patients-table');

    if (!searchElement || !riskFilter || !sexFilter || !sortFilter || !table) {
        return;
    }

    const query = searchElement.value.toLowerCase();
    const risk = riskFilter.value;
    const sex = sexFilter.value;
    const sort = sortFilter.value;

    const nextFilters = { query, risk, sex, sort };
    const hasChanged = JSON.stringify(nextFilters) !== JSON.stringify(appState.patientList.filters || {});
    if (hasChanged) {
        appState.patientList.page = 1;
        appState.patientList.filters = nextFilters;
    }

    const filtered = appState.patients.filter((patient) => {
        const searchable = `${patient.name} ${patient.id} ${patient.phone}`.toLowerCase();
        const matchesSex = sex === 'all' || String(patient.sex || '').toLowerCase() === sex.toLowerCase();
        return searchable.includes(query) && (risk === 'all' || patient.risk === risk) && matchesSex;
    });

    filtered.sort((left, right) => {
        const leftRisk = left.risk === 'High' ? 3 : left.risk === 'Moderate' ? 2 : 1;
        const rightRisk = right.risk === 'High' ? 3 : right.risk === 'Moderate' ? 2 : 1;
        switch (sort) {
            case 'name_asc':
                return String(left.name || '').localeCompare(String(right.name || ''));
            case 'age_desc':
                return Number(right.age || 0) - Number(left.age || 0);
            case 'risk_desc':
                return rightRisk - leftRisk;
            default:
                return String(right.last || '').localeCompare(String(left.last || ''));
        }
    });

    appState.patientList.filtered = filtered;
    const pageSize = appState.patientList.pageSize;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    appState.patientList.totalPages = totalPages;
    if (appState.patientList.page > totalPages) {
        appState.patientList.page = totalPages;
    }

    const startIndex = (appState.patientList.page - 1) * pageSize;
    const pagedRows = filtered.slice(startIndex, startIndex + pageSize);

    table.innerHTML = pagedRows.length
        ? pagedRows.map(patientRow).join('')
        : '<tr><td colspan="7" class="empty">No matching patients found.</td></tr>';

    setText('patient-total-count', formatNumber(appState.patients.length));
    setText('patient-high-risk-count', formatNumber(appState.patients.filter((patient) => patient.risk === 'High').length));
    setText('patient-alert-count', formatNumber(appState.patients.filter((patient) => String(patient.alert || '').trim()).length));
    setText('patient-page-count', `${appState.patientList.page}/${totalPages}`);
    setText('patients-range', filtered.length ? `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, filtered.length)} of ${filtered.length}` : 'Showing 0 of 0');
}

function changePatientPage(delta) {
    const nextPage = appState.patientList.page + delta;
    appState.patientList.page = Math.min(appState.patientList.totalPages || 1, Math.max(1, nextPage));
    renderPatients();
}

function exportPatients() {
    const rows = appState.patientList.filtered.length ? appState.patientList.filtered : appState.patients;
    const header = ['Patient ID', 'Name', 'Age', 'Sex', 'Phone', 'Last Visit', 'Condition', 'Risk', 'Alert'];
    const csvRows = [header.join(',')].concat(rows.map((patient) => [
        patient.id,
        patient.name,
        patient.age,
        patient.sex,
        patient.phone,
        patient.last,
        patient.condition,
        patient.risk,
        patient.alert,
    ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')));

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'patient-list.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function renderAttention() {
    const table = document.getElementById('attention-table');
    if (!table) {
        return;
    }

    const rows = Array.isArray(appState.dashboard?.attention_patients) && appState.dashboard.attention_patients.length
        ? appState.dashboard.attention_patients
        : appState.patients
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
    const analytics = appState.analytics || {};

    setText('dashboard-total-patients', formatNumber(dashboard.total_patients));
    setText('dashboard-total-patients-note', `${formatNumber(appState.patients.length)} active records in the facility`);
    setText('dashboard-high-risk-patients', formatNumber(dashboard.high_risk_patients));
    setText('dashboard-high-risk-note', `${dashboard.readmission_rate ?? 0}% of patients are high risk`);
    setText('dashboard-diabetes-cases', formatNumber(analytics.diabetes_cases));
    setText('dashboard-diabetes-note', `${formatNumber(analytics.high_risk_cohort)} high-risk patients in scope`);
    setText('dashboard-hypertension-cases', formatNumber(analytics.hypertension_cases));
    setText('dashboard-hypertension-note', `${formatNumber(analytics.average_age)} average patient age`);
    setText('dashboard-stroke-cases', formatNumber(analytics.stroke_cases));
    setText('dashboard-stroke-note', `${formatNumber(analytics.average_length_of_stay)} days average stay`);
    setText('dashboard-visits-this-month', formatNumber(dashboard.visits_this_month));
    setText('dashboard-visits-note', `${dashboard.readmission_rate ?? 0}% readmission indicator`);

    renderDashboardLineChart(dashboard.visit_trends?.labels || [], dashboard.visit_trends?.values || []);
    renderDashboardConditionDistribution(dashboard.condition_distribution || []);
    renderDashboardRiskDistribution(analytics.risk_distribution || []);
    renderDashboardGenderBars(analytics.gender_distribution || []);
    renderDashboardAlerts();
}

function renderAnalytics() {
    const analytics = appState.analytics || {};
    setText('hypertension-cases', analytics.hypertension_cases ?? '0');
    setText('diabetes-cases', analytics.diabetes_cases ?? '0');
    setText('stroke-cases', analytics.stroke_cases ?? '0');
    setText('high-risk-cohort', analytics.high_risk_cohort ?? '0');
    setText('analytics-visits-total', formatNumber((analytics.monthly_visits || []).reduce((sum, item) => sum + Number(item.value || 0), 0)));

    const avgAge = Number(analytics.average_age || 0).toFixed(1);
    const avgStay = Number(analytics.average_length_of_stay || 0).toFixed(1);
    setText('average-age', `${avgAge} years`);
    setText('average-stay-insight', `${avgStay} days`);
    setText('average-length-of-stay', `${avgStay} days`);
    setText('hypertension-note', 'Burden in the active cohort');
    setText('diabetes-note', 'Burden in the active cohort');
    setText('high-risk-note', `${formatNumber(analytics.high_risk_cohort)} patients flagged for follow-up`);
    setText('average-length-of-stay-note', 'Estimated from recent visits');
    setText('analytics-visits-note', `${(analytics.monthly_visits || []).length || 0} monthly buckets in scope`);

    renderAnalyticsMonthlyVisits(analytics.monthly_visits || []);
    renderAnalyticsRiskDistribution(analytics.risk_distribution || []);
    renderAnalyticsGenderBars(analytics.gender_distribution || []);
    renderAnalyticsInsights(analytics);
}

function renderAnalyticsMonthlyVisits(monthlyVisits) {
    const container = document.getElementById('analytics-monthly-bars');
    if (!container) {
        return;
    }

    const items = Array.isArray(monthlyVisits) && monthlyVisits.length
        ? monthlyVisits
        : [{ label: 'No data', value: 0 }];
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

    container.innerHTML = items.map((item, index) => {
        const value = Number(item.value || 0);
        const height = Math.max(18, Math.round((value / total) * 100));
        return `<div class="bar-col"><i style="height:${height}% ; background:${dashboardPalette(index)}"></i><span>${escapeHtml(item.label || 'Month')}</span><strong>${formatNumber(value)}</strong></div>`;
    }).join('');
}

function renderAnalyticsRiskDistribution(distribution) {
    const container = document.getElementById('analytics-risk-list');
    if (!container) {
        return;
    }

    const items = Array.isArray(distribution) && distribution.length
        ? distribution
        : [{ label: 'Low', value: 0 }, { label: 'Moderate', value: 0 }, { label: 'High', value: 0 }];
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

    container.innerHTML = items.map((item) => {
        const value = Number(item.value || 0);
        const width = Math.max(10, Math.round((value / total) * 100));
        const statusClass = riskClass(item.label);
        return `<div class="risk-row"><span>${escapeHtml(titleCase(item.label || 'Risk'))}</span><div class="bar ${statusClass === 'red' ? 'red' : statusClass === 'amber' ? 'amber' : ''}"><span style="width:${width}%"></span></div><strong class="status ${statusClass}">${formatNumber(value)}</strong></div>`;
    }).join('');
}

function renderAnalyticsGenderBars(distribution) {
    const container = document.getElementById('analytics-gender-bars');
    if (!container) {
        return;
    }

    const items = Array.isArray(distribution) && distribution.length
        ? distribution
        : [{ label: 'Female', value: 0 }, { label: 'Male', value: 0 }];
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

    container.innerHTML = items.map((item, index) => {
        const value = Number(item.value || 0);
        const height = Math.max(18, Math.round((value / total) * 100));
        return `<div class="bar-col"><i style="height:${height}% ; background:${dashboardPalette(index)}"></i><span>${escapeHtml(item.label || 'Group')}</span><strong>${formatNumber(value)}</strong></div>`;
    }).join('');
}

function renderAnalyticsInsights(analytics) {
    const peakMonthElement = document.getElementById('analytics-peak-month');
    const highRiskShareElement = document.getElementById('analytics-high-risk-share');
    if (!peakMonthElement && !highRiskShareElement) {
        return;
    }

    const monthlyVisits = Array.isArray(analytics?.monthly_visits) ? analytics.monthly_visits : [];
    const peakMonth = monthlyVisits.reduce((best, item) => Number(item.value || 0) > Number(best?.value || 0) ? item : best, monthlyVisits[0] || null);
    const totalPatients = Math.max(1, Number(analytics.hypertension_cases || 0) + Number(analytics.diabetes_cases || 0) + Number(analytics.stroke_cases || 0));
    const highRiskShare = ((Number(analytics.high_risk_cohort || 0) / totalPatients) * 100).toFixed(1);

    if (peakMonthElement) {
        peakMonthElement.textContent = peakMonth ? `${peakMonth.label || 'Month'} (${formatNumber(peakMonth.value)})` : '—';
    }

    if (highRiskShareElement) {
        highRiskShareElement.textContent = `${highRiskShare}%`;
    }
}

function createDownload(filename, content, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function csvCell(value) {
    return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function toCsv(headers, rows) {
    return [headers.join(',')].concat(rows.map((row) => row.map((value) => csvCell(value)).join(','))).join('\n');
}

function buildRiskRegistryRows(patients) {
    const grouped = patients.reduce((accumulator, patient) => {
        const key = patient.risk || 'Unknown';
        if (!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(patient);
        return accumulator;
    }, {});

    return Object.entries(grouped).flatMap(([risk, group]) => group.map((patient) => [risk, patient.id, patient.name, patient.condition, patient.last]));
}

function buildAnalyticsSnapshotRows() {
    const analytics = appState.analytics || {};
    const dashboard = appState.dashboard || {};
    const monthlyVisits = Array.isArray(analytics.monthly_visits) ? analytics.monthly_visits : [];
    return [[
        dashboard.visits_this_month || 0,
        analytics.hypertension_cases || 0,
        analytics.diabetes_cases || 0,
        analytics.stroke_cases || 0,
        analytics.high_risk_cohort || 0,
        Number(analytics.average_age || 0).toFixed(1),
        Number(analytics.average_length_of_stay || 0).toFixed(1),
        monthlyVisits.map((item) => `${item.label}:${item.value}`).join(' | '),
    ]];
}

function buildVisitDigestRows(patients) {
    return patients.map((patient) => [patient.id, patient.name, patient.condition, patient.risk, patient.last, patient.alert || '']);
}

function downloadReport(reportType) {
    const patients = Array.isArray(appState.patients) ? appState.patients : [];
    const analytics = appState.analytics || {};
    const dashboard = appState.dashboard || {};
    const timestamp = new Date().toISOString().slice(0, 10);

    if (reportType === 'patient-summary') {
        createDownload(
            `patient-summary-${timestamp}.csv`,
            toCsv(['Patient ID', 'Name', 'Age', 'Sex', 'Condition', 'Risk', 'Last Visit'], patients.map((patient) => [patient.id, patient.name, patient.age, patient.sex, patient.condition, patient.risk, patient.last]))
        );
        renderReportOverview();
        return;
    }

    if (reportType === 'risk-registry') {
        createDownload(
            `risk-registry-${timestamp}.csv`,
            toCsv(['Risk Level', 'Patient ID', 'Name', 'Condition', 'Last Visit'], buildRiskRegistryRows(patients))
        );
        renderReportOverview();
        return;
    }

    if (reportType === 'analytics-summary') {
        createDownload(
            `analytics-summary-${timestamp}.csv`,
            toCsv(['Visits This Month', 'Hypertension Cases', 'Diabetes Cases', 'Stroke Cases', 'High-Risk Cohort', 'Average Age', 'Average Length Of Stay', 'Monthly Visits'], buildAnalyticsSnapshotRows())
        );
        renderReportOverview();
        return;
    }

    if (reportType === 'visit-digest') {
        createDownload(
            `visit-digest-${timestamp}.csv`,
            toCsv(['Patient ID', 'Name', 'Condition', 'Risk', 'Last Visit', 'Alert'], buildVisitDigestRows(patients))
        );
        renderReportOverview();
        return;
    }

    alert('Unknown report type.');
}

function renderReportOverview() {
    const patients = Array.isArray(appState.patients) ? appState.patients : [];
    const analytics = appState.analytics || {};
    const dashboard = appState.dashboard || {};

    setText('reports-total-patients', formatNumber(patients.length));
    setText('reports-high-risk-patients', formatNumber(patients.filter((patient) => patient.risk === 'High').length));
    setText('reports-visits-this-month', formatNumber(dashboard.visits_this_month || 0));
    setText('reports-average-age', `${Number(analytics.average_age || 0).toFixed(1)} years`);
}

function readUiSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(UI_SETTINGS_KEY) || '{}');
        return { ...DEFAULT_UI_SETTINGS, ...stored };
    } catch (error) {
        return { ...DEFAULT_UI_SETTINGS };
    }
}

function writeUiSettings(settings) {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
}

function renderSettings() {
    const settings = readUiSettings();
    const fieldMap = {
        'facility-name': settings.facilityName,
        'facility-location': settings.facilityLocation,
        'facility-ward': settings.facilityWard,
        'facility-contact': settings.facilityContact,
        'settings-analytics-range': settings.analyticsRange,
        'settings-prediction-profile': settings.predictionProfile,
        'settings-report-format': settings.reportFormat,
        'settings-sidebar-mode': settings.sidebarMode,
    };

    Object.entries(fieldMap).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    });

    setText('settings-summary-facility', settings.facilityName || '—');
    setText('settings-summary-location', settings.facilityLocation || '—');
    setText('settings-summary-ward', settings.facilityWard || '—');
    setText('settings-summary-format', String(settings.reportFormat || 'csv').toUpperCase());
    setText('settings-summary-profile', titleCase(settings.predictionProfile || 'active'));
    setText('settings-status', settings.savedAt ? `Saved locally ${settings.savedAt}` : 'Saved locally');

    const analyticsRange = document.getElementById('analytics-range');
    if (analyticsRange) {
        analyticsRange.value = settings.analyticsRange || 'Last 6 months';
    }
}

function saveSettings(event) {
    event.preventDefault();
    const nextSettings = {
        facilityName: document.getElementById('facility-name')?.value.trim() || DEFAULT_UI_SETTINGS.facilityName,
        facilityLocation: document.getElementById('facility-location')?.value.trim() || DEFAULT_UI_SETTINGS.facilityLocation,
        facilityWard: document.getElementById('facility-ward')?.value.trim() || DEFAULT_UI_SETTINGS.facilityWard,
        facilityContact: document.getElementById('facility-contact')?.value.trim() || DEFAULT_UI_SETTINGS.facilityContact,
        analyticsRange: document.getElementById('settings-analytics-range')?.value || DEFAULT_UI_SETTINGS.analyticsRange,
        predictionProfile: document.getElementById('settings-prediction-profile')?.value || DEFAULT_UI_SETTINGS.predictionProfile,
        reportFormat: document.getElementById('settings-report-format')?.value || DEFAULT_UI_SETTINGS.reportFormat,
        sidebarMode: document.getElementById('settings-sidebar-mode')?.value || DEFAULT_UI_SETTINGS.sidebarMode,
        savedAt: new Date().toLocaleString(),
    };

    writeUiSettings(nextSettings);
    renderSettings();
    renderPredictionPage();
    alert('Settings saved locally.');
}

function resetSettings() {
    localStorage.removeItem(UI_SETTINGS_KEY);
    renderSettings();
    alert('Settings reset to defaults.');
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

    renderVisitPreview();
}

function getSelectedPredictionPatient() {
    const select = document.getElementById('prediction-patient');
    const selectedId = select?.value || appState.activePatient?.id || appState.patients[0]?.id || null;
    return appState.patients.find((patient) => patient.id === selectedId) || appState.activePatient || appState.patients[0] || null;
}

function getSelectedPredictionDisease() {
    return document.getElementById('prediction-disease')?.value || 'diabetes';
}

function getPredictionProfileMode() {
    return document.getElementById('prediction-profile')?.value || readUiSettings().predictionProfile || 'active';
}

function renderPredictionPatientOptions() {
    const select = document.getElementById('prediction-patient');
    if (!select) {
        return;
    }

    select.innerHTML = appState.patients.map((patient) => `<option value="${escapeHtml(patient.id)}">${escapeHtml(patient.name)} — ${escapeHtml(patient.id)}</option>`).join('');

    const preferredPatient = appState.activePatient || appState.patients[0];
    if (preferredPatient) {
        select.value = preferredPatient.id;
    }
}

function renderPredictionPatientSnapshot() {
    const patient = getSelectedPredictionPatient();
    const meta = document.getElementById('prediction-patient-meta');
    const name = document.getElementById('prediction-patient-name');
    const risk = document.getElementById('prediction-patient-risk');
    const last = document.getElementById('prediction-patient-last');
    const condition = document.getElementById('prediction-patient-condition');

    if (!patient) {
        if (name) name.textContent = 'No patient selected';
        if (meta) meta.textContent = 'Use a registered patient or switch to custom mode.';
        if (risk) risk.textContent = '—';
        if (last) last.textContent = '—';
        if (condition) condition.textContent = '—';
        return;
    }

    if (name) name.textContent = patient.name || 'Patient';
    if (meta) meta.textContent = `${patient.sex || 'Unknown'} · ${patient.age || '—'} years · ${patient.id || ''}`;
    if (risk) risk.textContent = `${patient.risk || 'Low'} risk`;
    if (last) last.textContent = patient.last || '—';
    if (condition) condition.textContent = patient.condition || '—';
}

function getPredictionDefaults(disease, patient) {
    const config = PREDICTION_CONFIGS[disease];
    if (!config) {
        return {};
    }

    const mode = getPredictionProfileMode();
    if (mode === 'custom') {
        return config.defaults(null);
    }

    return config.defaults(patient);
}

function renderPredictionFields() {
    const disease = getSelectedPredictionDisease();
    const config = PREDICTION_CONFIGS[disease];
    const grid = document.getElementById('prediction-feature-grid');
    const title = document.getElementById('prediction-features-title');
    if (!config || !grid) {
        return;
    }

    if (title) {
        title.textContent = config.title;
    }

    const patient = getSelectedPredictionPatient();
    const defaults = getPredictionDefaults(disease, patient);

    grid.innerHTML = config.fields.map((field) => {
        const fieldId = `prediction-${field.name}`;
        const value = defaults[field.name] ?? '';
        if (field.type === 'select') {
            return `<div class="field"><label for="${fieldId}">${escapeHtml(field.label)}</label><select id="${fieldId}" data-prediction-field="${escapeHtml(field.name)}">${field.options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></div>`;
        }

        const step = field.step ? ` step="${escapeHtml(field.step)}"` : '';
        return `<div class="field"><label for="${fieldId}">${escapeHtml(field.label)}</label><input id="${fieldId}" data-prediction-field="${escapeHtml(field.name)}" type="${field.type}" value="${escapeHtml(value)}" ${step} placeholder="${escapeHtml(field.placeholder || '')}"></div>`;
    }).join('');

    renderPredictionPatientSnapshot();
}

function usePredictionPatient() {
    renderPredictionPatientSnapshot();
    renderPredictionFields();
}

function useActivePatientForPrediction() {
    const patient = appState.activePatient || appState.patients[0] || null;
    const patientSelect = document.getElementById('prediction-patient');
    const profileSelect = document.getElementById('prediction-profile');
    if (patientSelect && patient) {
        patientSelect.value = patient.id;
    }
    if (profileSelect) {
        profileSelect.value = 'active';
    }
    renderPredictionFields();
}

function resetPredictionForm() {
    const profileSelect = document.getElementById('prediction-profile');
    if (profileSelect) {
        profileSelect.value = 'active';
    }
    renderPredictionFields();
    clearPredictionResult();
}

function collectPredictionFeatures() {
    const fields = document.querySelectorAll('[data-prediction-field]');
    const payload = {};
    fields.forEach((field) => {
        payload[field.dataset.predictionField] = field.value;
    });
    return payload;
}

function clearPredictionResult() {
    setText('prediction-result-label', 'Awaiting analysis');
    setText('prediction-result-summary', 'Run a model to view the result, probability, and guidance.');
    setText('prediction-risk-level', '—');
    setText('prediction-probability', '—');
    setText('prediction-confidence', '—');
    const barFill = document.getElementById('prediction-bar-fill');
    if (barFill) {
        barFill.style.width = '0%';
    }
    setHTML('prediction-result-badges', '');
    setHTML('prediction-importance', '');
    setHTML('prediction-recommendations', '');
    setHTML('prediction-preventive', '');
    setHTML('prediction-feature-values', '');
}

function renderPredictionImportance(items) {
    const container = document.getElementById('prediction-importance');
    if (!container) {
        return;
    }

    container.innerHTML = items.length
        ? items.map((item) => {
            const importance = Math.round(Number(item.importance || 0) * 1000) / 10;
            return `<div class="importance-row"><span>${escapeHtml(item.feature || 'Feature')}</span><div class="bar"><span style="width:${Math.max(8, Math.min(100, importance))}%"></span></div><strong>${importance}%</strong></div>`;
        }).join('')
        : '<div class="profile-stack-item"><strong>No feature importance available</strong><span>The current estimator does not expose feature importances.</span></div>';
}

function renderPredictionValueList(values) {
    const container = document.getElementById('prediction-feature-values');
    if (!container) {
        return;
    }

    container.innerHTML = Object.entries(values || {}).length
        ? Object.entries(values).map(([key, value]) => `<div class="profile-stack-item"><strong>${escapeHtml(titleCase(key))}</strong><span>${escapeHtml(value)}</span></div>`).join('')
        : '<div class="profile-stack-item"><strong>No values available</strong><span>The submitted payload was empty.</span></div>';
}

function renderPredictionHistory() {
    const container = document.getElementById('prediction-history');
    if (!container) {
        return;
    }

    const history = JSON.parse(localStorage.getItem(PREDICTION_HISTORY_KEY) || '[]');
    container.innerHTML = history.length
        ? history.slice(0, 5).map((item) => `<div class="profile-stack-item"><strong>${escapeHtml(item.disease)} · ${escapeHtml(item.result)}</strong><span>${escapeHtml(item.patientName || 'Unknown patient')} · ${escapeHtml(item.timestamp || '')}</span></div>`).join('')
        : '<div class="profile-stack-item"><strong>No predictions yet</strong><span>Run a model to save it into the local history.</span></div>';
}

function savePredictionHistory(entry) {
    const history = JSON.parse(localStorage.getItem(PREDICTION_HISTORY_KEY) || '[]');
    history.unshift(entry);
    localStorage.setItem(PREDICTION_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    renderPredictionHistory();
}

function renderPredictionResult(response, features) {
    const riskPercent = Math.round(Number(response.probability || 0) * 100);
    const isHighRisk = String(response.prediction || '').toLowerCase().includes('high');
    const riskLevel = response.risk_level || (riskPercent >= 80 ? 'High' : riskPercent >= 55 ? 'Moderate' : 'Low');
    const badgeLabel = `${response.disease || 'Disease'} · ${response.prediction || 'Prediction'}`;

    setText('prediction-result-label', badgeLabel);
    setText('prediction-result-summary', `${response.disease || 'The model'} returned a ${riskLevel.toLowerCase()} risk assessment for the selected patient.`);
    setText('prediction-risk-level', riskLevel);
    setText('prediction-probability', `${riskPercent}%`);
    setText('prediction-confidence', response.confidence || `${riskPercent}%`);

    const barFill = document.getElementById('prediction-bar-fill');
    if (barFill) {
        barFill.style.width = `${Math.max(4, riskPercent)}%`;
    }

    const badgeTone = riskLevel === 'High' ? 'red' : riskLevel === 'Moderate' ? 'amber' : 'green';
    setHTML('prediction-result-badges', [
        `<span class="visit-pill ${badgeTone}">${escapeHtml(riskLevel)} risk</span>`,
        `<span class="visit-pill">${escapeHtml(response.confidence || `${riskPercent}% confidence`)}</span>`,
        `<span class="visit-pill">${escapeHtml(response.disease || 'Model run')}</span>`,
    ].join(''));

    setHTML('prediction-recommendations', (response.recommendations || []).map((item) => `<div class="profile-stack-item"><strong>${escapeHtml(item)}</strong><span>Rule-based recommendation from the backend.</span></div>`).join('') || '<div class="profile-stack-item"><strong>No recommendations returned</strong><span>The model completed without guidance text.</span></div>');
    setHTML('prediction-preventive', (response.preventive_measures || []).map((item) => `<div class="profile-stack-item"><strong>${escapeHtml(item)}</strong><span>Preventive measure from the clinical decision support layer.</span></div>`).join('') || '<div class="profile-stack-item"><strong>No preventive advice returned</strong><span>The model did not return a preventive measure list.</span></div>');
    renderPredictionImportance(response.feature_importance || []);
    renderPredictionValueList(response.feature_values_used || features || {});

    const patient = getSelectedPredictionPatient();
    savePredictionHistory({
        disease: response.disease || 'Prediction',
        result: response.prediction || 'Unknown',
        patientName: patient?.name || 'Unknown patient',
        timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    });
}

async function runPrediction(event) {
    if (event) {
        event.preventDefault();
    }

    const disease = getSelectedPredictionDisease();
    const config = PREDICTION_CONFIGS[disease];
    if (!config) {
        return;
    }

    const features = collectPredictionFeatures();
    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ features }),
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || data.error || 'Prediction could not be generated.');
            return;
        }

        renderPredictionResult(data, features);
        authToast(`${config.title} model completed.`, 'success');
    } catch (error) {
        console.error(error);
        alert('Prediction could not be generated.');
    }
}

function renderPredictionPage() {
    const settings = readUiSettings();
    const profileSelect = document.getElementById('prediction-profile');
    if (profileSelect) {
        profileSelect.value = settings.predictionProfile || 'active';
    }
    renderPredictionPatientOptions();
    renderPredictionFields();
    renderPredictionHistory();
    clearPredictionResult();
}

function getSelectedVisitPatient() {
    const select = document.getElementById('visit-patient');
    const selectedId = select?.value || appState.activePatient?.id || appState.patients[0]?.id || null;
    return appState.patients.find((patient) => patient.id === selectedId) || appState.activePatient || appState.patients[0] || null;
}

function parseBloodPressure(value) {
    const match = String(value || '').match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (!match) {
        return { systolic: 0, diastolic: 0 };
    }

    return { systolic: Number(match[1]), diastolic: Number(match[2]) };
}

function buildVisitAssessment() {
    const selectedPatient = getSelectedVisitPatient();
    const bloodPressure = parseBloodPressure(document.getElementById('bp')?.value);
    const glucose = Number(document.getElementById('glucose')?.value || 0);
    const pulse = Number(document.getElementById('pulse')?.value || 0);
    const temperature = Number(document.getElementById('temperature')?.value || 0);
    const spo2 = Number(document.getElementById('spo2')?.value || 0);
    const bmi = Number.parseFloat(document.getElementById('bmi')?.textContent || '0') || 0;
    const symptoms = String(document.getElementById('symptoms')?.value || '').toLowerCase();

    let score = 0;
    const badges = [];

    if (bloodPressure.systolic >= 160 || bloodPressure.diastolic >= 100) {
        score += 30;
        badges.push('Severe hypertension');
    } else if (bloodPressure.systolic >= 140 || bloodPressure.diastolic >= 90) {
        score += 18;
        badges.push('Elevated blood pressure');
    }

    if (glucose >= 180) {
        score += 24;
        badges.push('Marked hyperglycemia');
    } else if (glucose >= 126) {
        score += 16;
        badges.push('Raised glucose');
    }

    if (bmi >= 30) {
        score += 10;
        badges.push('Obesity risk');
    }

    if (pulse >= 110 || pulse <= 50) {
        score += 10;
        badges.push('Abnormal pulse');
    }

    if (temperature >= 38) {
        score += 8;
        badges.push('Fever');
    }

    if (spo2 > 0 && spo2 < 95) {
        score += 16;
        badges.push('Low oxygen saturation');
    }

    ['headache', 'dizziness', 'blurred', 'shortness of breath', 'chest pain', 'weakness'].forEach((term) => {
        if (symptoms.includes(term)) {
            score += 4;
            badges.push(titleCase(term));
        }
    });

    if (selectedPatient?.risk === 'High') {
        score += 10;
        badges.push('Existing high-risk patient');
    }

    score = Math.min(100, score);
    const riskLabel = score >= 40 ? 'High Risk' : score >= 18 ? 'Moderate Risk' : 'Low Risk';
    const confidence = Math.min(97, Math.max(52, Math.round(48 + score * 0.6)));
    const riskPercent = Math.max(3, Math.min(100, score));

    const recommendations = riskLabel === 'High Risk'
        ? [
            'Escalate to senior clinician review.',
            'Repeat vitals and review laboratory values before discharge.',
            'Provide urgent medication and lifestyle counselling.',
        ]
        : riskLabel === 'Moderate Risk'
            ? [
                'Schedule a close follow-up within 2 to 4 weeks.',
                'Reinforce diet, activity, and medication adherence.',
                'Monitor glucose and blood pressure trends.',
            ]
            : [
                'Continue routine care and preventive counselling.',
                'Document the visit and monitor at the next appointment.',
                'Maintain current treatment plan unless symptoms change.',
            ];

    const labFlags = [];
    const hba1c = Number(document.getElementById('lab-hba1c')?.value || 0);
    const creatinine = Number(document.getElementById('lab-creatinine')?.value || 0);
    const cholesterol = Number(document.getElementById('lab-cholesterol')?.value || 0);
    const urineProtein = String(document.getElementById('lab-urine')?.value || 'Negative');

    if (hba1c >= 7) {
        labFlags.push('HbA1c elevated');
    }
    if (creatinine >= 1.3) {
        labFlags.push('Renal function review');
    }
    if (cholesterol >= 200) {
        labFlags.push('Lipids above target');
    }
    if (urineProtein !== 'Negative') {
        labFlags.push(`Urine protein ${urineProtein.toLowerCase()}`);
    }

    return {
        selectedPatient,
        riskLabel,
        confidence,
        riskPercent,
        badges: Array.from(new Set(badges)).slice(0, 5),
        recommendations,
        labFlags,
    };
}

function renderVisitPreview() {
    const assessment = buildVisitAssessment();
    const patient = assessment.selectedPatient;

    if (!patient) {
        setText('visit-patient-name', 'No patient selected');
        setText('visit-patient-meta', 'Choose a patient to view their demographics and history.');
        setText('visit-snapshot-risk', '—');
        setText('visit-snapshot-last', '—');
        setText('visit-snapshot-condition', '—');
        setText('visit-snapshot-age', '—');
        setText('visit-ai-label', 'Awaiting assessment');
        setText('visit-ai-risk', '0%');
        setText('visit-ai-confidence', 'Confidence will update as fields change.');
        setHTML('visit-ai-badges', '');
        setHTML('visit-recommendations', '');
        setHTML('visit-history', '');
        return;
    }

    setText('visit-patient-name', patient.name || 'Patient');
    setText('visit-patient-meta', `${patient.sex || 'Unknown'} · ${patient.id || ''}`);
    setText('visit-snapshot-risk', `${patient.risk || 'Low'} risk`);
    setText('visit-snapshot-last', patient.last || '—');
    setText('visit-snapshot-condition', patient.condition || '—');
    setText('visit-snapshot-age', `${patient.age || '—'} years`);

    setText('visit-ai-label', assessment.riskLabel);
    setText('visit-ai-risk', `${assessment.riskPercent}%`);
    setText('visit-ai-confidence', `${assessment.confidence}% confidence from current vitals and clinical inputs.`);

    const riskBar = document.getElementById('visit-ai-risk-bar');
    if (riskBar) {
        riskBar.style.width = `${assessment.riskPercent}%`;
    }

    const badges = document.getElementById('visit-ai-badges');
    if (badges) {
        badges.innerHTML = assessment.badges.length
            ? assessment.badges.map((badge) => `<span class="visit-pill">${escapeHtml(badge)}</span>`).join('')
            : '<span class="visit-pill">No major risk flags</span>';
    }

    const recommendations = document.getElementById('visit-recommendations');
    if (recommendations) {
        recommendations.innerHTML = assessment.recommendations.map((item) => `<div class="profile-stack-item"><strong>${escapeHtml(item)}</strong><span>Suggested from the current clinical inputs.</span></div>`).join('');
    }

    const history = document.getElementById('visit-history');
    const recentVisits = Array.isArray(patient.timeline) ? patient.timeline.slice(0, 3) : [];
    if (history) {
        history.innerHTML = recentVisits.length
            ? recentVisits.map((visit) => `<div class="profile-stack-item"><strong>${escapeHtml(visit.title || 'Visit')}</strong><span>${escapeHtml(visit.date || '—')} · ${escapeHtml(visit.alert || visit.description || '')}</span></div>`).join('')
            : '<div class="profile-stack-item"><strong>No recorded visits</strong><span>This patient has no prior consultation history.</span></div>';
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
    setText('profile-id', patient.id || '—');
    setText('profile-risk-badge', `${patient.risk || 'Low'} risk`);
    setText('profile-condition-badge', patient.condition || 'Clinical review pending');
    setText('profile-alert-badge', patient.alert || 'No active alert');
    setText('profile-bp', patient.blood_pressure || '—');
    setText('profile-glucose', patient.glucose ? `${patient.glucose} mg/dL` : '—');
    setText('profile-bmi', patient.bmi ? `${Number(patient.bmi).toFixed(1)}` : '—');
    setText('profile-insulin', patient.insulin ? `${patient.insulin}` : '—');

    const timeline = document.getElementById('timeline');
    if (timeline) {
        const events = Array.isArray(patient.timeline) ? patient.timeline : [];
        timeline.innerHTML = events.length
            ? events.map((event) => `<div class="event"><time>${escapeHtml(event.date || '')}</time><h3>${escapeHtml(event.title || 'Visit')}</h3><p>${escapeHtml(event.description || '')}</p></div>`).join('')
            : '<div class="event"><time>—</time><h3>No history available</h3><p>No visits have been recorded for this patient yet.</p></div>';
    }

    const latestVisit = Array.isArray(patient.timeline) && patient.timeline.length ? patient.timeline[0] : null;
    const medicationContainer = document.getElementById('profile-medication');
    if (medicationContainer) {
        medicationContainer.innerHTML = latestVisit?.medication
            ? `<div class="profile-stack-item"><strong>${escapeHtml(latestVisit.medication)}</strong><span>${escapeHtml(latestVisit.diagnosis || patient.condition || '')}</span></div>`
            : '<div class="profile-stack-item"><strong>No active prescription</strong><span>No medication information has been recorded for this patient yet.</span></div>';
    }

    const notesContainer = document.getElementById('profile-notes');
    if (notesContainer) {
        notesContainer.textContent = latestVisit?.description || patient.alert || 'No clinical notes available.';
    }

    const confidence = patient.risk === 'High' ? 89 : patient.risk === 'Moderate' ? 61 : 26;
    setText('profile-confidence', `${confidence}%`);
    setText('profile-risk-percent', `${confidence}%`);

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
        prediction: 'AI predictions',
        appointments: 'Appointments',
        analytics: 'Analytics',
        reports: 'Reports',
        users: 'Users',
        settings: 'Settings',
    };
    setText('crumb', labels[id] || id);
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (id === 'patients') {
        renderPatients();
    }

    if (id === 'visit') {
        renderVisitOptions();
    }

    if (id === 'prediction') {
        renderPredictionPage();
    }

    if (id === 'reports') {
        renderReportOverview();
    }

    if (id === 'settings') {
        renderSettings();
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
    renderPredictionPage();
    renderAnalytics();
    renderReportOverview();
    renderSettings();
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

document.querySelectorAll('[data-open-sidebar]').forEach((button) => {
    button.addEventListener('click', openSidebar);
});

document.querySelectorAll('[data-close-sidebar]').forEach((button) => {
    button.addEventListener('click', closeSidebar);
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
        const session = requireSessionOrRedirect();
        if (!session) {
            return;
        }

        renderSessionChrome(session);
        await loadState();
        showPage('dashboard');
    } catch (error) {
        console.error(error);
    }
});