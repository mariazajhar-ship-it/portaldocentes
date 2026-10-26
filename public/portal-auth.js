// ============================================
// portal-auth.js — Autenticación y estado global
// ============================================

// Variables globales compartidas
window.token = localStorage.getItem('token');
window.currentUser = null;

// ============================================
// 🔐 MANEJO GLOBAL DE 401 (sesión expirada)
// Intercepta todas las respuestas 401 y cierra la sesión automáticamente
// ============================================
(function intercept401() {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);

        if (response && response.status === 401) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            const isLogin = url.includes('/api/auth/login');

            // No interrumpir el intento de login (ahí el 401 es un error normal)
            if (!isLogin && window.token) {
                console.warn('⚠️ Sesión expirada (401). Cerrando sesión automáticamente...');
                stopInactivityMonitor();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.token = null;
                window.currentUser = null;
                const errorElement = document.getElementById('loginError');
                if (errorElement) errorElement.textContent = '⏰ Tu sesión expiró. Vuelve a iniciar sesión.';
                showLoginPanel();
            }
        }

        return response;
    };
})();

// ============================================
// LOGIN
// ============================================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.token = data.token;
            window.currentUser = data.user;
            localStorage.setItem('token', window.token);
            localStorage.setItem('user', JSON.stringify(window.currentUser));
            showAdminPanel();

            // ⚠️ Recordatorio de seguridad: el usuario admin usa la contraseña por defecto
            if (window.currentUser?.username === 'admin') {
                mostrarRecordatorioAdmin();
            }
        } else {
            errorElement.textContent = data.error || 'Error al iniciar sesión';
        }
    } catch (error) {
        errorElement.textContent = 'Error de conexión al servidor';
    }
});

// ============================================
// INACTIVITY TIMEOUT — Cierre de sesión por inactividad
// ============================================
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;   // 30 minutos (recomendado)
const WARNING_BEFORE   = 60 * 1000;          // Aviso 1 minuto antes

let inactivityTimer = null;
let warningTimer     = null;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);

    // Aviso de que la sesión está por expirar
    warningTimer = setTimeout(() => {
        const sigue = confirm(
            '⚠️  Sesión por expirar\n\n' +
            'Has estado inactivo por un periodo prolongado. ' +
            'La sesión se cerrará en 1 minuto si no hay actividad.\n\n' +
            '¿Desea continuar?'
        );
        if (sigue) {
            resetInactivityTimer();
        }
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    // Cierre automático
    inactivityTimer = setTimeout(() => {
        logoutInactividad();
    }, INACTIVITY_TIMEOUT);
}

function logoutInactividad() {
    stopInactivityMonitor();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.token = null;
    window.currentUser = null;
    showLoginPanel();
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = '⏰ Sesión cerrada por inactividad. Vuelve a iniciar sesión.';
    }
}

// Eventos de usuario que reinician el contador
const INACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

function startInactivityMonitor() {
    stopInactivityMonitor(); // Limpiar por si ya existían listeners
    INACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();
}

function stopInactivityMonitor() {
    INACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
    });
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    inactivityTimer = null;
    warningTimer = null;
}

// ============================================
// 🔒 CAMBIAR CONTRASEÑA
// ============================================
function mostrarRecordatorioAdmin() {
    if (sessionStorage.getItem('password_reminder_shown')) return;
    sessionStorage.setItem('password_reminder_shown', '1');

    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7;color:#92400e;padding:0.8rem 1.5rem;display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap;font-size:0.9rem;border-bottom:1px solid #f59e0b;';
    banner.innerHTML = `
        <span><i class="fas fa-shield-alt"></i> <strong>Seguridad:</strong> estás usando la contraseña por defecto. Cámbiala para proteger el panel.</span>
        <button id="btnRecordatorioCambiarPass" class="btn-warning" style="padding:0.4rem 1rem;border-radius:6px;"><i class="fas fa-key"></i> Cambiar ahora</button>
    `;
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.insertBefore(banner, adminPanel.firstChild);

    document.getElementById('btnRecordatorioCambiarPass')?.addEventListener('click', () => {
        banner.remove();
        abrirModalCambiarPassword();
    });
}

function abrirModalCambiarPassword() {
    if (typeof openModal !== 'function') return;

    openModal('Cambiar Contraseña', `
        <form id="changePasswordForm">
            <div class="form-group"><label>Contraseña Actual *</label>
                <input type="password" id="pass_actual" placeholder="Tu contraseña actual" required autocomplete="current-password">
            </div>
            <div class="form-group"><label>Nueva Contraseña *</label>
                <input type="password" id="pass_nueva" placeholder="Mínimo 6 caracteres" required autocomplete="new-password">
            </div>
            <div class="form-group"><label>Confirmar Nueva Contraseña *</label>
                <input type="password" id="pass_confirmar" placeholder="Repite la nueva contraseña" required autocomplete="new-password">
            </div>
            <button type="submit" class="btn-primary btn-block"><i class="fas fa-key"></i> Actualizar Contraseña</button>
        </form>
    `);

    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password_actual = document.getElementById('pass_actual').value;
        const password_nueva = document.getElementById('pass_nueva').value;
        const password_confirmar = document.getElementById('pass_confirmar').value;

        if (password_nueva !== password_confirmar) {
            alert('❌ Las contraseñas nuevas no coinciden');
            return;
        }
        if (password_nueva.length < 6) {
            alert('❌ La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.token}`
                },
                body: JSON.stringify({ password_actual, password_nueva })
            });

            const result = await response.json();

            if (response.ok) {
                alert('✅ ' + (result.message || 'Contraseña actualizada exitosamente'));
                document.getElementById('modal').style.display = 'none';
            } else {
                alert('❌ ' + (result.error || 'Error al cambiar la contraseña'));
            }
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            alert('❌ Error al conectar con el servidor');
        }
    });
}

// ============================================
// LOGOUT
// ============================================
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    // 1) Eliminar la sesión/autenticación del administrador
    stopInactivityMonitor();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.token = null;
    window.currentUser = null;

    // 2) Redirigir al portal público (consulta de visitantes) en lugar
    //    de volver a mostrar el formulario de inicio de sesión
    window.location.href = '/';
});

// Botón "Cambiar contraseña" del encabezado
document.getElementById('btnChangePassword')?.addEventListener('click', () => {
    abrirModalCambiarPassword();
});

// ============================================
// VERIFICAR SESIÓN
// ============================================
async function checkAuth() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
        window.token = savedToken;
        window.currentUser = JSON.parse(savedUser);

        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${window.token}` }
            });
            if (response.ok) {
                showAdminPanel();
                return true;
            }
        } catch (error) {
            console.error('Error al verificar token:', error);
        }

        console.warn('⚠️ Token inválido o expirado, limpiando sesión');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.token = null;
        window.currentUser = null;
    }
    showLoginPanel();
    return false;
}

// ============================================
// MOSTRAR PANELES
// ============================================
function showLoginPanel() {
    stopInactivityMonitor();
    const loginEl = document.getElementById('loginContainer');
    const adminEl = document.getElementById('adminPanel');
    if (loginEl) loginEl.style.display = 'flex';
    if (adminEl) adminEl.style.display = 'none';
}

function showAdminPanel() {
    startInactivityMonitor();
    const loginEl = document.getElementById('loginContainer');
    const adminEl = document.getElementById('adminPanel');
    const userNameEl = document.getElementById('userName');
    if (loginEl) loginEl.style.display = 'none';
    if (adminEl) adminEl.style.display = 'block';
    if (userNameEl) {
        userNameEl.textContent = window.currentUser?.nombre || window.currentUser?.username || 'Admin';
    }

    // ⚠️ Recordatorio de seguridad (también al restaurar sesión)
    if (window.currentUser?.username === 'admin') {
        mostrarRecordatorioAdmin();
    }

    // Cargar datos
    if (typeof loadDashboard === 'function') loadDashboard();
    if (typeof loadDocentes === 'function') loadDocentes();
    if (typeof loadAreas === 'function') loadAreas();
    if (typeof loadMaterias === 'function') loadMaterias();

    // Cargar selects de horarios
    setTimeout(() => {
        if (typeof cargarSelectsHorarios === 'function') cargarSelectsHorarios();
    }, 300);

    // Configurar eventos de búsqueda
    try {
        if (typeof configurarEventosBusqueda === 'function') configurarEventosBusqueda();
    } catch (error) {
        console.error('Error al configurar eventos de búsqueda:', error);
    }
}
