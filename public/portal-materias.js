// ============================================
// portal-materias.js — CRUD de Materias
// ============================================

let materiasCache = [];

// ============================================
// CARGAR MATERIAS
// ============================================
async function loadMaterias() {
    try {
        const response = await fetch('/api/materias', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const materias = await response.json();
        materiasCache = materias;
        renderMateriasTable(materias);
        cargarFiltroAreasMaterias();
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

function renderMateriasTable(materias) {
    const tbody = document.getElementById('materiasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!materias || materias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">
                    <i class="fas fa-info-circle"></i> No hay materias registradas
                </td>
            </tr>
        `;
        return;
    }

    materias.forEach(materia => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${materia.id}</td>
            <td><strong>${materia.nombre}</strong></td>
            <td><span class="badge-area">${materia.area_nombre || 'Sin área'}</span></td>
            <td>
                <button class="btn-primary" data-action="view-materia-docentes" data-id="${materia.id}" style="padding:0.3rem 0.8rem;font-size:0.8rem;">
                    <i class="fas fa-users"></i> Ver
                </button>
            </td>
            <td>
                <button class="btn-warning" data-action="edit-materia" data-id="${materia.id}" style="padding:0.3rem 0.8rem;font-size:0.8rem;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" data-action="delete-materia" data-id="${materia.id}" style="padding:0.3rem 0.8rem;font-size:0.8rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// EVENT DELEGATION — Reemplaza onclick inline (CSP-safe)
// ============================================
document.getElementById('materiasTableBody')?.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;
    if (action === 'edit-materia') editMateria(parseInt(id));
    else if (action === 'delete-materia') deleteMateria(parseInt(id));
    else if (action === 'view-materia-docentes') verDocentesMateria(parseInt(id));
});

// ============================================
// FILTROS DE MATERIAS
// ============================================
async function cargarFiltroAreasMaterias() {
    try {
        const response = await fetch('/api/areas', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const areas = await response.json();
        const select = document.getElementById('filterMateriaArea');
        if (!select) return;

        select.innerHTML = '<option value="todos">Todas las Áreas</option>';
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar áreas para filtro:', error);
    }
}

function filtrarMaterias() {
    const searchText = document.getElementById('searchMateria')?.value.toLowerCase() || '';
    const areaFilter = document.getElementById('filterMateriaArea')?.value || 'todos';

    let materiasFiltradas = materiasCache;

    if (areaFilter !== 'todos') {
        materiasFiltradas = materiasFiltradas.filter(m => m.area_id === areaFilter);
    }

    if (searchText) {
        materiasFiltradas = materiasFiltradas.filter(m =>
            m.nombre.toLowerCase().includes(searchText)
        );
    }

    renderMateriasTable(materiasFiltradas);
}

// ============================================
// EDITAR MATERIA
// ============================================
window.editMateria = async function (id) {
    try {
        const response = await fetch(`/api/materias/${id}`, {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const materia = await response.json();

        const areasResp = await fetch('/api/areas', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const areas = await areasResp.json();

        const areaOptions = areas.map(area =>
            `<option value="${area.id}" ${area.id === materia.area_id ? 'selected' : ''}>${area.nombre}</option>`
        ).join('');

        openModal('Editar Materia', `
            <form id="editMateriaForm">
                <div class="form-group"><label>Nombre de la Materia *</label><input type="text" id="edit_materia_nombre" value="${materia.nombre}" required></div>
                <div class="form-group"><label>Área *</label><select id="edit_materia_area" required>${areaOptions}</select></div>
                <button type="submit" class="btn-primary btn-block"><i class="fas fa-save"></i> Actualizar Materia</button>
            </form>
        `);

        document.getElementById('editMateriaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('edit_materia_nombre').value;
            const area_id = document.getElementById('edit_materia_area').value;

            if (!nombre || nombre.trim() === '') { alert('Por favor ingresa el nombre de la materia'); return; }
            if (!area_id) { alert('Por favor selecciona un área'); return; }

            try {
                const response = await fetch(`/api/materias/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.token}`
                    },
                    body: JSON.stringify({ nombre, area_id })
                });
                const result = await response.json();
                if (response.ok) {
                    alert('✅ Materia actualizada exitosamente');
                    document.getElementById('modal').style.display = 'none';
                    loadMaterias();
                    loadDashboard();
                } else {
                    alert('❌ Error: ' + (result.error || 'Error al actualizar materia'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Error al conectar con el servidor');
            }
        });
    } catch (error) {
        console.error('Error al cargar materia:', error);
        alert('Error al cargar los datos de la materia');
    }
};

// ============================================
// ELIMINAR MATERIA
// ============================================
window.deleteMateria = async function (id) {
    const materia = materiasCache.find(m => m.id === id);
    const nombre = materia ? materia.nombre : 'esta materia';

    if (confirm(`¿Estás seguro de eliminar la materia "${nombre}"?`)) {
        try {
            const response = await fetch(`/api/materias/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${window.token}` }
            });
            const result = await response.json();
            if (response.ok) {
                alert('✅ Materia eliminada exitosamente');
                loadMaterias();
                loadDashboard();
            } else {
                alert('❌ Error: ' + (result.error || 'Error al eliminar materia'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al conectar con el servidor');
        }
    }
};

// ============================================
// VER DOCENTES DE UNA MATERIA
// ============================================
window.verDocentesMateria = async function (materiaId) {
    try {
        const [materiaResp, docentesResp] = await Promise.all([
            fetch(`/api/materias/${materiaId}`, { headers: { 'Authorization': `Bearer ${window.token}` } }),
            fetch('/api/docentes', { headers: { 'Authorization': `Bearer ${window.token}` } })
        ]);

        const materia = await materiaResp.json();
        const docentes = await docentesResp.json();

        const docentesFiltrados = docentes.filter(d =>
            d.materias && d.materias.includes(materia.nombre)
        );

        let content = `
            <div style="padding: 0.5rem;">
                <h4 style="color: var(--primary-color); margin-bottom: 1rem;">
                    <i class="fas fa-users"></i> Docentes que imparten "${materia.nombre}"
                </h4>
        `;

        if (docentesFiltrados.length === 0) {
            content += `<p style="text-align:center;color:var(--text-muted);padding:2rem;"><i class="fas fa-info-circle"></i> No hay docentes asignados a esta materia</p>`;
        } else {
            content += `<div style="display:grid;gap:0.5rem;">
                ${docentesFiltrados.map(d => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                        <div><strong>${d.nombre}</strong> <span style="font-size:0.85rem;color:var(--text-muted);margin-left:0.5rem;">${d.area_nombre}</span></div>
                        <span style="font-size:0.85rem;color:var(--text-muted);">${d.cargo}</span>
                    </div>
                `).join('')}
            </div>`;
        }
        content += `</div>`;
        openModal(`Docentes de ${materia.nombre}`, content);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los docentes');
    }
};
