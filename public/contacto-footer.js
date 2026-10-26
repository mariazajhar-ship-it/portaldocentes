// ============================================
// contacto-footer.js — Pie de página del portal público
// ============================================
// Rellena el bloque "Información de Contacto" del footer con los datos
// guardados en la base de datos (editables desde el Panel Administrativo).
// Se usa en index.html y docente.html.

async function cargarContactoFooter() {
    try {
        const response = await fetch('/api/contacto');
        if (!response.ok) return;

        const contacto = await response.json();
        const esc = (v) => String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const email = document.getElementById('footer-contact-email');
        const telefono = document.getElementById('footer-contact-telefono');
        const direccion = document.getElementById('footer-contact-direccion');

        if (email) {
            email.innerHTML = `<i class="fas fa-envelope"></i> ${esc(contacto.email) || '—'}`;
        }

        if (telefono) {
            telefono.innerHTML = `<i class="fas fa-phone"></i> ${esc(contacto.telefono) || '—'}`;
        }

        if (direccion) {
            const localidad = [contacto.ciudad, contacto.departamento, contacto.pais]
                .filter(Boolean)
                .map(esc)
                .join(', ');
            const partes = [esc(contacto.direccion), localidad].filter(Boolean);
            direccion.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${partes.join('<br>') || '—'}`;
        }
    } catch (error) {
        console.warn('No se pudo cargar la información de contacto:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarContactoFooter);
} else {
    cargarContactoFooter();
}
