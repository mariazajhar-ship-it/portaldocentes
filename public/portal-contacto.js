// ============================================
// portal-contacto.js — Información de Contacto del Portal Público
// ============================================
// GET  /api/contacto -> carga los datos en el formulario
// PUT  /api/contacto -> guarda (solo admin) y el portal público los muestra

async function loadContacto() {
    try {
        const response = await fetch('/api/contacto');
        if (!response.ok) throw new Error('Error en la respuesta del servidor');

        const contacto = await response.json();

        const set = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.value = valor || '';
        };

        set('cont_email', contacto.email);
        set('cont_telefono', contacto.telefono);
        set('cont_direccion', contacto.direccion);
        set('cont_ciudad', contacto.ciudad);
        set('cont_departamento', contacto.departamento);
        set('cont_pais', contacto.pais);
    } catch (error) {
        console.error('Error al cargar la información de contacto:', error);
    }
}

document.getElementById('contactoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        email: document.getElementById('cont_email')?.value.trim() || '',
        telefono: document.getElementById('cont_telefono')?.value.trim() || '',
        direccion: document.getElementById('cont_direccion')?.value.trim() || '',
        ciudad: document.getElementById('cont_ciudad')?.value.trim() || '',
        departamento: document.getElementById('cont_departamento')?.value.trim() || '',
        pais: document.getElementById('cont_pais')?.value.trim() || ''
    };

    const msg = document.getElementById('contactoMsg');
    if (msg) msg.textContent = '';

    try {
        const response = await fetch('/api/contacto', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            if (msg) {
                msg.style.color = '#166534';
                msg.textContent = '✅ Guardado. El portal público ya muestra esta información.';
            }
            alert('✅ Información de contacto guardada.\n\nEl portal público ya muestra los datos actualizados.');
            loadContacto();
        } else {
            if (msg) {
                msg.style.color = '#b91c1c';
                msg.textContent = '❌ ' + (result.error || 'No se pudo guardar');
            }
            alert('❌ Error: ' + (result.error || 'No se pudo guardar la información'));
        }
    } catch (error) {
        console.error('Error al guardar la información de contacto:', error);
        if (msg) {
            msg.style.color = '#b91c1c';
            msg.textContent = '❌ Error al conectar con el servidor';
        }
        alert('❌ Error al conectar con el servidor');
    }
});

// Cargar los datos al abrir el panel (por si el usuario entra directo a la pestaña)
if (document.getElementById('contactoForm')) {
    loadContacto();
}
