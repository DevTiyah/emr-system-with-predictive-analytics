const AUTH_STORAGE_KEY = 'emrAuthSession';

function readSession() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function writeSession(session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
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

function initials(value) {
    return String(value || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function toast(message, kind = 'success') {
    let node = document.querySelector('.auth-toast');
    if (!node) {
        node = document.createElement('div');
        node.className = 'auth-toast';
        document.body.appendChild(node);
    }

    node.className = `auth-toast ${kind}`;
    node.textContent = message;
    requestAnimationFrame(() => node.classList.add('show'));
    window.clearTimeout(window.__authToastTimer);
    window.__authToastTimer = window.setTimeout(() => node.classList.remove('show'), 2200);
}

function redirect(path, delay = 0) {
    window.setTimeout(() => {
        window.location.href = path;
    }, delay);
}

function sessionFromFields(fields) {
    const email = fields.email || '';
    const role = fields.role || 'Doctor';
    const department = fields.department || 'General Medicine';
    const phone = fields.phone || '+234 800 000 0000';
    const name = fields.name || titleCase(email.split('@')[0].replace(/[._-]+/g, ' ')) || role;

    return {
        name,
        email,
        phone,
        role,
        department,
        lastLogin: new Date().toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
        }),
        initials: initials(name || email || role),
    };
}

function populateProfile(session) {
    document.querySelectorAll('[data-session-field]').forEach((node) => {
        const key = node.dataset.sessionField;
        if (key && session[key] !== undefined && session[key] !== null) {
            node.textContent = session[key];
        }
    });
}

function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const session = sessionFromFields({
        email: document.getElementById('login-email')?.value,
        role: document.getElementById('login-role')?.value,
        department: document.getElementById('login-department')?.value,
    });

    writeSession(session);
    toast(`Welcome back, ${session.name}.`);
    redirect('/', 550);
}

function handleRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = document.getElementById('register-password')?.value || '';
    const confirm = document.getElementById('register-confirm')?.value || '';

    if (password !== confirm) {
        toast('Passwords do not match.', 'error');
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const session = sessionFromFields({
        name: document.getElementById('register-name')?.value,
        email: document.getElementById('register-email')?.value,
        phone: document.getElementById('register-phone')?.value,
        role: document.getElementById('register-role')?.value,
        department: document.getElementById('register-department')?.value,
    });

    writeSession(session);
    toast('Account created. Opening the dashboard.');
    redirect('/', 650);
}

function handleForgot(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const email = document.getElementById('forgot-email')?.value || '';
    localStorage.setItem('emrResetEmail', email);
    toast('Recovery link prepared. Opening reset screen.');
    redirect(`/reset-password?email=${encodeURIComponent(email)}&token=EMR-RESET-2026`, 650);
}

function handleReset(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = document.getElementById('reset-password-input')?.value || '';
    const confirm = document.getElementById('reset-confirm')?.value || '';

    if (password !== confirm) {
        toast('Passwords do not match.', 'error');
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const session = readSession();
    if (session) {
        writeSession({
            ...session,
            passwordUpdatedAt: new Date().toISOString(),
        });
    }

    toast('Password updated successfully.');
    redirect('/login', 700);
}

function initializeLogout() {
    clearSession();
    const status = document.getElementById('logout-status');
    if (status) {
        status.textContent = 'Your session was cleared successfully. Redirecting to the sign-in page.';
    }
    redirect('/login', 1200);
}

function initializeAuthPage() {
    const page = document.body.dataset.authPage || '';
    const session = readSession();

    if ((page === 'login' || page === 'register') && session) {
        redirect('/', 0);
        return;
    }

    if (page === 'profile') {
        if (!session) {
            redirect('/login', 0);
            return;
        }
        populateProfile(session);
        return;
    }

    if (page === 'logout') {
        initializeLogout();
        return;
    }

    if (page === 'login') {
        document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    }

    if (page === 'register') {
        document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    }

    if (page === 'forgot-password') {
        document.getElementById('forgot-form')?.addEventListener('submit', handleForgot);
    }

    if (page === 'reset-password') {
        const tokenField = document.getElementById('reset-token');
        const token = new URLSearchParams(window.location.search).get('token');
        if (tokenField && token) {
            tokenField.value = token;
        }
        document.getElementById('reset-form')?.addEventListener('submit', handleReset);
    }
}

window.addEventListener('DOMContentLoaded', initializeAuthPage);
