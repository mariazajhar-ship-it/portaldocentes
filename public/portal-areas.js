// ============================================
// portal-areas.js — CRUD de Áreas
// ============================================

// ============================================
// CARGAR ÁREAS
// ============================================
async function loadAreas() {
    try {
        const response = await fetch('/api/areas', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const areas = await response.json();
        renderAreasTable(areas);
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

function renderAreasTable(areas) {
    const tbody = document.getElementById('areasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    areas.forEach(area => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${area.id}</td>
            <td>${area.nombre}</td>
            <td><i class="fas fa-${area.icono || 'book'}"></i></td>
            <td>${area.popular ? '✅' : '❌'}</td>
            <td>
                <button class="btn-warning" data-action="edit-area" data-id="${area.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-danger" data-action="delete-area" data-id="${area.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// EDITAR ÁREA
// ============================================
window.editArea = async function (id) {
    try {
        const response = await fetch(`/api/areas/${id}`, {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const area = await response.json();
        if (!area) { alert('❌ Error: No se encontró el área'); return; }

        openModal('Editar Área', `
            <form id="editAreaForm">
                <div style="background:#f1f5f9;padding:0.8rem;border-radius:8px;margin-bottom:1rem;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label>ID del Área</label>
                        <input type="text" value="${area.id}" disabled style="background:#e2e8f0;color:#475569;font-weight:bold;">
                        <small style="color:var(--text-muted);">El ID no se puede modificar</small>
                    </div>
                </div>
                <div class="form-group"><label>Nombre del Área *</label><input type="text" id="edit_area_nombre" value="${area.nombre || ''}" required></div>
                <div class="form-group"><label>Icono (Font Awesome)</label><input type="text" id="edit_area_icono" value="${area.icono || ''}" placeholder="Ej: sigma, book, flask"></div>
                <div class="form-group"><label>Descripción</label><textarea id="edit_area_descripcion" rows="3">${area.descripcion || ''}</textarea></div>
                <div class="form-group" style="margin-top:1rem;padding:0.8rem;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                        <input type="checkbox" id="edit_area_popular" ${area.popular ? 'checked' : ''} style="width:18px;height:18px;">
                        <span style="font-weight:600;color:#166534;"><i class="fas fa-star"></i> Popular</span>
                    </label>
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:1rem;">
                    <button type="submit" class="btn-primary" style="flex:1;"><i class="fas fa-save"></i> Actualizar Área</button>
                    <button type="button" data-action="close" class="btn-danger" style="flex:0.3;"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </form>
        `);

        document.getElementById('editAreaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('edit_area_nombre').value.trim(),
                icono: document.getElementById('edit_area_icono').value.trim(),
                descripcion: document.getElementById('edit_area_descripcion').value.trim(),
                popular: document.getElementById('edit_area_popular').checked
            };

            if (!data.nombre) { alert('⚠️ El nombre del área es obligatorio'); return; }

            try {
                const response = await fetch(`/api/areas/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.token}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Error al actualizar área');

                alert(`✅ Área "${data.nombre}" actualizada exitosamente`);
                document.getElementById('modal').style.display = 'none';
                loadAreas();
                loadDashboard();
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Error: ' + error.message);
            }
        });
    } catch (error) {
        console.error('Error al cargar área:', error);
        alert('❌ Error al cargar los datos del área');
    }
};

// ============================================
// EVENT DELEGATION — Reemplaza onclick inline (CSP-safe)
// ============================================
document.getElementById('areasTableBody')?.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;
    if (action === 'edit-area') editArea(id);
    else if (action === 'delete-area') deleteArea(id);
});

// ============================================
// ELIMINAR ÁREA
// ============================================
window.deleteArea = async function (id) {
    if (confirm('¿Estás seguro de eliminar esta área?')) {
        try {
            const response = await fetch(`/api/areas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${window.token}` }
            });
            if (response.ok) {
                alert('Área eliminada exitosamente');
                loadAreas();
                loadDashboard();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Error al eliminar el área'));
            }
        } catch (error) {
            alert('Error al eliminar el área');
        }
    }
};
