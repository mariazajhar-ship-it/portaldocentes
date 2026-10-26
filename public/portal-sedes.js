// ============================================
// portal-sedes.js — CRUD de Sedes
// ============================================

// ============================================
// CARGAR SEDES
// ============================================
async function loadSedes() {
    try {
        const response = await fetch('/api/sedes', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const sedes = await response.json();
        renderSedesTable(sedes);
    } catch (error) {
        console.error('Error al cargar sedes:', error);
    }
}

function renderSedesTable(sedes) {
    const tbody = document.getElementById('sedesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!sedes || sedes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">
                    <i class="fas fa-info-circle"></i> No hay sedes registradas
                </td>
            </tr>
        `;
        return;
    }

    sedes.forEach(sede => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sede.id}</td>
            <td><strong>${sede.nombre}</strong></td>
            <td>${sede.direccion || 'N/A'}</td>
            <td>${sede.activo ? '<span style="color:var(--success-color);font-weight:600;">✅ Activa</span>' : '<span style="color:var(--danger-color);font-weight:600;">❌ Inactiva</span>'}</td>
            <td>
                <button class="btn-warning" data-action="edit-sede" data-id="${sede.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-danger" data-action="delete-sede" data-id="${sede.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// CARGAR SEDES EN SELECT
// ============================================
async function cargarSelectSedes(selectId, selectedId = null) {
    try {
        const response = await fetch('/api/sedes?activos=true');
        const sedes = await response.json();
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar sede</option>';
        sedes.forEach(sede => {
            const option = document.createElement('option');
            option.value = sede.id;
            option.textContent = sede.nombre;
            if (selectedId && parseInt(selectedId) === sede.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar sedes en select:', error);
    }
}

// ============================================
// EDITAR SEDE
// ============================================
window.editSede = async function (id) {
    try {
        const response = await fetch(`/api/sedes/${id}`, {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const sede = await response.json();
        if (!sede) { alert('❌ Error: No se encontró la sede'); return; }

        openModal('Editar Sede', `
            <form id="editSedeForm">
                <div class="form-group"><label>Nombre de la Sede *</label><input type="text" id="edit_sede_nombre" value="${sede.nombre || ''}" required></div>
                <div class="form-group"><label>Dirección</label><input type="text" id="edit_sede_direccion" value="${sede.direccion || ''}" placeholder="Dirección de la sede"></div>
                <div class="form-group"><label>Descripción</label><textarea id="edit_sede_descripcion" rows="3">${sede.descripcion || ''}</textarea></div>
                <div style="padding:0.8rem;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:1rem;">
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                        <input type="checkbox" id="edit_sede_activo" ${sede.activo ? 'checked' : ''} style="width:18px;height:18px;">
                        <span style="font-weight:600;color:#166534;"><i class="fas fa-check-circle"></i> Sede Activa</span>
                    </label>
                </div>
                <div style="display:flex;gap:0.5rem;">
                    <button type="submit" class="btn-primary" style="flex:1;"><i class="fas fa-save"></i> Actualizar Sede</button>
                    <button type="button" data-action="close" class="btn-danger" style="flex:0.3;"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </form>
        `);

        document.getElementById('editSedeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('edit_sede_nombre').value.trim(),
                direccion: document.getElementById('edit_sede_direccion').value.trim(),
                descripcion: document.getElementById('edit_sede_descripcion').value.trim(),
                activo: document.getElementById('edit_sede_activo').checked
            };

            if (!data.nombre) { alert('⚠️ El nombre de la sede es obligatorio'); return; }

            try {
                const response = await fetch(`/api/sedes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.token}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Error al actualizar sede');

                alert(`✅ Sede "${data.nombre}" actualizada exitosamente`);
                document.getElementById('modal').style.display = 'none';
                loadSedes();
                loadDashboard();
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Error: ' + error.message);
            }
        });
    } catch (error) {
        console.error('Error al cargar sede:', error);
        alert('❌ Error al cargar los datos de la sede');
    }
};

// ============================================
// EVENT DELEGATION
// ============================================
document.getElementById('sedesTableBody')?.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;
    if (action === 'edit-sede') editSede(parseInt(id));
    else if (action === 'delete-sede') deleteSede(parseInt(id));
});

// ============================================
// ELIMINAR SEDE
// ============================================
window.deleteSede = async function (id) {
    if (confirm('¿Estás seguro de eliminar esta sede?')) {
        try {
            const response = await fetch(`/api/sedes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${window.token}` }
            });
            const result = await response.json();
            if (response.ok) {
                if (result.desactivada) {
                    alert(`✅ ${result.message}`);
                } else {
                    alert('✅ Sede eliminada exitosamente');
                }
                loadSedes();
                loadDashboard();
            } else {
                const error = await response.json();
                alert('❌ Error: ' + (error.error || 'Error al eliminar la sede'));
            }
        } catch (error) {
            alert('❌ Error al eliminar la sede');
        }
    }
};
