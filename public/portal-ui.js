// ============================================
// portal-ui.js — Modal y utilidades de UI
// ============================================

// ============================================
// MODAL
// ============================================
function openModal(title, content) {
    console.log('📂 Abriendo modal:', title);
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('modal');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = content;
    if (modal) modal.style.display = 'flex';
}

function cerrarModalResultado() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
}

// Event delegation para acciones en modales (CSP-safe)
document.getElementById('modalBody')?.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'close') {
        cerrarModalResultado();
    }
});

// Eventos del modal
document.querySelector('.close-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
});

document.getElementById('modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    }
});

// ============================================
// 🔒 CANDADOS DE VISIBILIDAD PÚBLICA
// ============================================
// Campos que el administrador puede abrir/cerrar para el portal público.
// estado[campo] === true  → candado abierto  → SÍ se muestra públicamente
// estado[campo] === false → candado cerrado  → NO se muestra públicamente
const CAMPOS_CON_CANDADO = ['nivel_academico', 'horario_atencion', 'email', 'telefono', 'formacion', 'area'];
const COLOR_CANDADO_ABIERTO = '#16a34a';
const COLOR_CANDADO_CERRADO = '#dc2626';
const TEXTO_CANDADO_ABIERTO = 'Visible en el portal público (clic para ocultar)';
const TEXTO_CANDADO_CERRADO = 'Oculto en el portal público (clic para mostrar)';

// Estado inicial: si el docente no tiene configuración, todo queda visible (comportamiento actual)
function estadoVisibilidad(docente) {
    const campos = (docente && docente.visibilidad && docente.visibilidad.campos) || {};
    const estado = {};
    CAMPOS_CON_CANDADO.forEach(campo => {
        estado[campo] = campos[campo] !== false;
    });
    return estado;
}

// HTML del candado de un campo (va dentro del <label> del campo)
function candadoHTML(campo, visible) {
    const icono = visible ? 'fa-lock-open' : 'fa-lock';
    const titulo = visible ? TEXTO_CANDADO_ABIERTO : TEXTO_CANDADO_CERRADO;
    const color = visible ? COLOR_CANDADO_ABIERTO : COLOR_CANDADO_CERRADO;
    return `<button type="button" class="btn-lock" data-campo="${campo}" title="${titulo}" aria-label="${titulo}" style="border:none;background:transparent;cursor:pointer;padding:0;margin-left:0.4rem;font-size:0.9rem;line-height:1;color:${color};"><i class="fas ${icono}"></i></button>`;
}

// Activa el clic de los candados dentro de un formulario y mantiene `estado` al día
function activarCandados(formId, estado) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('.btn-lock') : null;
        if (!btn) return;
        e.preventDefault();

        const campo = btn.dataset.campo;
        if (!campo || !(campo in estado)) return;

        estado[campo] = !estado[campo];
        const visible = estado[campo];
        const icono = btn.querySelector('i');
        if (icono) icono.className = 'fas ' + (visible ? 'fa-lock-open' : 'fa-lock');
        btn.title = visible ? TEXTO_CANDADO_ABIERTO : TEXTO_CANDADO_CERRADO;
        btn.setAttribute('aria-label', btn.title);
        btn.style.color = visible ? COLOR_CANDADO_ABIERTO : COLOR_CANDADO_CERRADO;
    });
}
