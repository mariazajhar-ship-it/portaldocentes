// ============================================
// portal-docentes.js — CRUD de Docentes y búsqueda
// ============================================

let buscando = false;

// ============================================
// CARGAR Y RENDERIZAR
// ============================================
async function loadDocentes() {
    try {
        const response = await fetch('/api/docentes', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const docentes = await response.json();
        renderDocentesTable(docentes);
    } catch (error) {
        console.error('Error al cargar docentes:', error);
    }
}

function renderDocentesTable(docentes) {
    const tbody = document.getElementById('docentesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!docentes || docentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">
                    <i class="fas fa-info-circle"></i> No hay docentes registrados
                </td>
            </tr>
        `;
        return;
    }

    docentes.forEach(docente => {
        const esActivo = docente.visibilidad?.activo !== false;
        const estadoHTML = esActivo
            ? '<span style="color: var(--success-color); font-weight: 600;">✅ Activo</span>'
            : '<span style="color: var(--danger-color); font-weight: 600;">❌ Inactivo</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${docente.nombre}</strong></td>
            <td><code style="background:#f1f5f9;padding:0.2rem 0.5rem;border-radius:4px;">${docente.cedula || 'N/A'}</code></td>
            <td>${docente.area_nombre}</td>
            <td><span style="background:#e8f5e9;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.85rem;color:#2e7d32;"><i class="fas fa-map-marker-alt"></i> ${docente.sede_nombre || 'Sin sede'}</span></td>
            <td>${estadoHTML}</td>
            <td>
                <button class="btn-warning" data-action="edit-docente" data-id="${docente.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" data-action="delete-docente" data-id="${docente.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-primary" data-action="view-docente" data-id="${docente.id}" title="Ver detalles" style="padding:0.5rem 0.8rem;">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// BÚSQUEDA POR NOMBRE (real, contra la base de datos)
// ============================================
async function buscarDocentePorNombre(nombre) {
    if (buscando) return;

    if (!nombre || nombre.trim() === '') {
        alert('⚠️ Por favor ingresa el nombre del docente');
        return;
    }

    buscando = true;

    try {
        const btn = document.getElementById('btnBuscarNombre');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            btn.disabled = true;
        }

        // Búsqueda real en el backend: GET /api/docentes?nombre=...
        // (la consulta SQL hace LIKE %nombre% sobre docentes.nombre)
        const params = new URLSearchParams({ nombre: nombre.trim() });
        const response = await fetch(`/api/docentes?${params}`, {
            headers: {
                'Authorization': `Bearer ${window.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Error al buscar docentes');
        }

        const docentes = await response.json();

        if (!docentes || docentes.length === 0) {
            alert('❌ No se encontraron docentes con ese nombre');
        }

        // Los resultados se muestran en la misma tabla de docentes
        // (conserva acciones de editar / eliminar / ver detalles)
        renderDocentesTable(docentes);
    } catch (error) {
        console.error('Error al buscar por nombre:', error);
        alert('❌ Error: ' + (error.message || 'Error al buscar docentes'));
    } finally {
        const btn = document.getElementById('btnBuscarNombre');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-search"></i> Buscar';
            btn.disabled = false;
        }
        setTimeout(() => { buscando = false; }, 300);
    }
}

function limpiarBusqueda() {
    const input = document.getElementById('searchNombre');
    const filter = document.getElementById('filterEstadoDocente');
    if (input) input.value = '';
    if (filter) filter.value = 'todos';
    loadDocentes();
}

// ============================================
// EVENT DELEGATION — Reemplaza onclick inline (CSP-safe)
// ============================================
document.getElementById('docentesTableBody')?.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;
    if (action === 'edit-docente') editDocente(parseInt(id));
    else if (action === 'delete-docente') deleteDocente(parseInt(id));
    else if (action === 'view-docente') verDetalles(parseInt(id));
});

// Event delegation para acciones en modales
const modalBody = document.getElementById('modalBody');
if (modalBody) {
    modalBody.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'close') { cerrarModalResultado(); return; }
        if (!id) return;
        if (action === 'edit-docente') editDocente(parseInt(id));
        else if (action === 'delete-docente') deleteDocente(parseInt(id));
        else if (action === 'view-docente') verDetalles(parseInt(id));
    });
}

// ============================================
// CONFIGURAR EVENTOS DE BÚSQUEDA
// ============================================
// Indica si los listeners de búsqueda ya fueron registrados.
// showAdminPanel() puede ejecutarse varias veces (login y restauración de sesión),
// y sin esta marca los listeners se acumulaban.
let eventosBusquedaConfigurados = false;

function configurarEventosBusqueda() {
    // ============================================
    // FILTRO POR SEDE — se limpia antes de cargar
    // (las sedes se pueblan de nuevo sin duplicarse)
    // ============================================
    const filterSede = document.getElementById('filterSedeDocente');
    if (filterSede) {
        fetch('/api/sedes?activos=true')
            .then(r => r.json())
            .then(sedes => {
                const select = document.getElementById('filterSedeDocente');
                if (!select) return;

                // Se limpia AQUÍ, al escribir y no antes del fetch: así cada
                // respuesta REEMPLAZA el contenido del select y, aunque lleguen
                // dos respuestas a la vez, nunca se acumulan sedes duplicadas.
                select.innerHTML = '<option value="todos">Todas las Sedes</option>';

                const vistos = new Set();
                sedes.forEach(sede => {
                    // Protección: cada sede se agrega una sola vez
                    if (vistos.has(sede.id)) return;
                    vistos.add(sede.id);

                    const option = document.createElement('option');
                    option.value = sede.id;
                    option.textContent = sede.nombre;
                    select.appendChild(option);
                });
            })
            .catch(err => console.error('Error al cargar sedes en filtro:', err));
    }

    // ============================================
    // LISTENERS — se registran una sola vez
    // ============================================
    if (eventosBusquedaConfigurados) return;
    eventosBusquedaConfigurados = true;

    const btnBuscar = document.getElementById('btnBuscarNombre');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('searchNombre').value;
            buscarDocentePorNombre(nombre);
        });
    }

    const inputNombre = document.getElementById('searchNombre');
    if (inputNombre) {
        inputNombre.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nombre = document.getElementById('searchNombre').value;
                buscarDocentePorNombre(nombre);
            }
        });
    }

    const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', (e) => {
            e.preventDefault();
            limpiarBusqueda();
        });
    }

    const filterEstado = document.getElementById('filterEstadoDocente');
    if (filterEstado) {
        filterEstado.addEventListener('change', function () {
            aplicarFiltrosAdmin();
        });
    }

    // Filtro por sede
    if (filterSede) {
        filterSede.addEventListener('change', function () {
            aplicarFiltrosAdmin();
        });
    }
}

function aplicarFiltrosAdmin() {
    const estado = document.getElementById('filterEstadoDocente')?.value;
    const sede = document.getElementById('filterSedeDocente')?.value;

    if ((estado === 'todos' || !estado) && (sede === 'todos' || !sede)) {
        loadDocentes();
        return;
    }

    fetch('/api/docentes', {
        headers: { 'Authorization': `Bearer ${window.token}` }
    })
        .then(r => r.json())
        .then(docentes => {
            let filtrados = docentes;

            if (estado && estado !== 'todos') {
                const activo = estado === 'activos';
                filtrados = filtrados.filter(d => {
                    const esActivo = d.visibilidad?.activo !== false;
                    return activo ? esActivo : !esActivo;
                });
            }

            if (sede && sede !== 'todos') {
                filtrados = filtrados.filter(d => parseInt(d.sede_id) === parseInt(sede));
            }

            renderDocentesTable(filtrados);
        })
        .catch(err => console.error('Error al filtrar:', err));
}

// ============================================
// EDITAR DOCENTE
// ============================================
window.editDocente = async function (id) {
    try {
        const response = await fetch(`/api/docentes/${id}`, {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const docente = await response.json();
        if (!docente) { alert('❌ Error: No se encontró el docente'); return; }

        const [areasResp, materiasResp, materiasDocenteResp] = await Promise.all([
            fetch('/api/areas', { headers: { 'Authorization': `Bearer ${window.token}` } }),
            fetch('/api/materias', { headers: { 'Authorization': `Bearer ${window.token}` } }),
            fetch(`/api/materias/docente/${id}`, { headers: { 'Authorization': `Bearer ${window.token}` } })
        ]);

        const areas = await areasResp.json();
        const materias = await materiasResp.json();
        const materiasDocente = await materiasDocenteResp.json();
        const materiasDocenteIds = materiasDocente.map(m => m.id);

        const areaOptions = areas.map(area =>
            `<option value="${area.id}" ${area.id === docente.area_id ? 'selected' : ''}>${area.nombre}</option>`
        ).join('');

        // Obtener sedes
        let sedesOptions = '<option value="">Sin sede</option>';
        try {
            const sedesResp = await fetch('/api/sedes?activos=true', {
                headers: { 'Authorization': `Bearer ${window.token}` }
            });
            const sedes = await sedesResp.json();
    sedesOptions += sedes.map(s =>
        `<option value="${s.id}" ${parseInt(s.id) === parseInt(docente.sede_id) ? 'selected' : ''}>${s.nombre}</option>`
    ).join('');
        } catch (e) {
            console.warn('No se pudieron cargar sedes:', e);
        }

        const materiasOptions = materias.map(materia => {
            const checked = materiasDocenteIds.includes(materia.id) ? 'checked' : '';
            return `<label style="display:inline-block;margin:0.3rem 0.5rem;padding:0.3rem 0.8rem;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer;">
                        <input type="checkbox" class="materia-check" value="${materia.id}" ${checked}>
                        ${materia.nombre}
                    </label>`;
        }).join('');

        const fechaNac = docente.fecha_nacimiento || '';

        // Estado de los candados de visibilidad pública de este docente
        const visibilidadCampos = estadoVisibilidad(docente);

        openModal('Editar Docente', `
            <form id="editDocenteForm">
                <div style="background:#f1f5f9;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-user"></i> Datos Personales</h4>
                    <div class="form-row">
                        <div class="form-group"><label>Nombre Completo *</label><input type="text" id="edit_nombre" value="${docente.nombre || ''}" required></div>
                        <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Cédula *</label><input type="text" id="edit_cedula" value="${docente.cedula || ''}" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Fecha de Nacimiento *</label><input type="date" id="edit_fecha_nacimiento" value="${fechaNac}"></div>
                        <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Género *</label>
                            <select id="edit_genero" required>
                                <option value="Masculino" ${docente.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                                <option value="Femenino" ${docente.genero === 'Femenino' ? 'selected' : ''}>Femenino</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Cargo *</label><input type="text" id="edit_cargo" value="${docente.cargo || ''}" required></div>
                </div>

                <div style="background:#f0fdf4;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-graduation-cap"></i> Datos Académicos</h4>
                    <div class="form-row">
                        <div class="form-group"><label>Área Principal * ${candadoHTML('area', visibilidadCampos.area)}</label><select id="edit_area" required><option value="">Seleccionar área</option>${areaOptions}</select></div>
                        <div class="form-group"><label>Sede</label><select id="edit_sede">${sedesOptions}</select></div>
                        <div class="form-group"><label>Formación ${candadoHTML('formacion', visibilidadCampos.formacion)}</label><input type="text" id="edit_formacion" value="${docente.formacion || ''}"></div>
                        <div class="form-group"><label>Nivel Académico ${candadoHTML('nivel_academico', visibilidadCampos.nivel_academico)}</label>
                            <select id="edit_nivel_academico">
                                <option value="">Seleccionar nivel</option>
                                <option value="Licenciatura / Profesional" ${docente.nivel_academico === 'Licenciatura / Profesional' ? 'selected' : ''}>Licenciatura / Profesional</option>
                                <option value="Especialización" ${docente.nivel_academico === 'Especialización' ? 'selected' : ''}>Especialización</option>
                                <option value="Maestría / Magister" ${docente.nivel_academico === 'Maestría / Magister' ? 'selected' : ''}>Maestría / Magister</option>
                                <option value="Doctorado" ${docente.nivel_academico === 'Doctorado' ? 'selected' : ''}>Doctorado</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Grado de Escalafón *</label><input type="text" id="edit_grado_escalafon" value="${docente.grado_escalafon || ''}" maxlength="100" placeholder="GRADO 2 NIVEL A"></div>
                        <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Tipo de Vinculación *</label>
                            <select id="edit_tipo_nombramiento">
                                <option value="Propiedad" ${docente.tipo_nombramiento === 'Propiedad' ? 'selected' : ''}>Propiedad</option>
                                <option value="Traslado en Propiedad" ${docente.tipo_nombramiento === 'Traslado en Propiedad' ? 'selected' : ''}>Traslado en Propiedad</option>
                                <option value="Provisional" ${docente.tipo_nombramiento === 'Provisional' ? 'selected' : ''}>Provisional</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style="background:#eff6ff;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-book"></i> Materias que Dicta</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${materiasOptions || '<p style="color:var(--text-muted);">No hay materias disponibles</p>'}</div>
                </div>

                <div style="background:#fef3c7;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-address-card"></i> Datos de Contacto</h4>
                    <div class="form-row">
                        <div class="form-group"><label>Email ${candadoHTML('email', visibilidadCampos.email)}</label><input type="email" id="edit_email" value="${docente.email || ''}"></div>
                        <div class="form-group"><label>Teléfono ${candadoHTML('telefono', visibilidadCampos.telefono)}</label><input type="text" id="edit_telefono" value="${docente.telefono || ''}"></div>
                    </div>
                </div>

                <div style="background:#fce4ec;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-clock"></i> Datos Laborales</h4>
                    <div class="form-group"><label>Horario de Atención ${candadoHTML('horario_atencion', visibilidadCampos.horario_atencion)}</label><input type="text" id="edit_horario" value="${docente.horario_atencion || ''}"></div>
                    <div class="form-group"><label>Sobre mí</label><textarea id="edit_sobre_mi" rows="3">${docente.sobre_mi || ''}</textarea></div>
                </div>

                <!-- FOTO -->
                <div style="background:#e8f5e9;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-camera"></i> Foto del Docente</h4>
                    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                        <div id="edit_foto_preview" style="width:80px;height:80px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px solid #e2e8f0;flex-shrink:0;">
                            ${docente.foto_url
                                ? `<img src="${docente.foto_url}" style="width:100%;height:100%;object-fit:cover;">`
                                : '<i class="fas fa-user" style="font-size:2rem;color:#94a3b8;"></i>'}
                        </div>
                        <div style="flex:1;">
                            <input type="file" id="edit_doc_foto" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;">
                            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                                <button type="button" id="btn_select_foto_edit" class="btn-primary" style="padding:0.5rem 1rem;font-size:0.9rem;"><i class="fas fa-upload"></i> Cambiar Foto</button>
                                ${docente.foto_url ? '<button type="button" id="btn_remove_foto" class="btn-danger" style="padding:0.5rem 1rem;font-size:0.9rem;"><i class="fas fa-trash"></i> Eliminar Foto</button>' : ''}
                            </div>
                            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem;">JPG, PNG, GIF o WebP. Máximo 2 MB.</p>
                        </div>
                    </div>
                </div>

                <div style="background:#e8eaf6;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                    <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-toggle-on"></i> Estado del Docente</h4>
                    <div style="display:flex;gap:2rem;">
                        <label><input type="radio" name="estado_docente" value="activo" ${docente.visibilidad?.activo !== false ? 'checked' : ''}> ✅ Activo</label>
                        <label><input type="radio" name="estado_docente" value="inactivo" ${docente.visibilidad?.activo === false ? 'checked' : ''}> ❌ Inactivo</label>
                    </div>
                </div>

                <div style="display:flex;gap:0.5rem;">
                    <button type="submit" class="btn-primary" style="flex:1;"><i class="fas fa-save"></i> Actualizar Docente</button>
                    <button type="button" data-action="close" class="btn-danger" style="flex:0.3;"><i class="fas fa-times"></i> Cancelar</button>
                </div>
            </form>
        `);

        // Candados de visibilidad pública (guardados por docente)
        activarCandados('editDocenteForm', visibilidadCampos);

        // Botones de foto en edición
        let editPhotoChanged = false;
        let editPhotoRemoved = false;

        const btnSelectFotoEdit = document.getElementById('btn_select_foto_edit');
        const editInputFoto = document.getElementById('edit_doc_foto');
        const editFotoPreview = document.getElementById('edit_foto_preview');
        const btnRemoveFoto = document.getElementById('btn_remove_foto');

        if (btnSelectFotoEdit && editInputFoto) {
            btnSelectFotoEdit.addEventListener('click', () => editInputFoto.click());
            editInputFoto.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        alert('⚠️ La imagen no debe superar los 2 MB');
                        editInputFoto.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        editFotoPreview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                    };
                    reader.readAsDataURL(file);
                    editPhotoChanged = true;
                    editPhotoRemoved = false;
                }
            });
        }

        if (btnRemoveFoto) {
            btnRemoveFoto.addEventListener('click', () => {
                editFotoPreview.innerHTML = '<i class="fas fa-user" style="font-size:2rem;color:#94a3b8;"></i>';
                editPhotoRemoved = true;
                editPhotoChanged = false;
                if (editInputFoto) editInputFoto.value = '';
                btnRemoveFoto.style.display = 'none';
            });
        }

        // Submit del formulario de edición
        document.getElementById('editDocenteForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const materiasSeleccionadas = [];
            document.querySelectorAll('.materia-check:checked').forEach(cb => {
                materiasSeleccionadas.push(parseInt(cb.value));
            });

            const estadoActivo = document.querySelector('input[name="estado_docente"]:checked')?.value === 'activo';

            const data = {
                nombre: document.getElementById('edit_nombre').value.trim(),
                cedula: document.getElementById('edit_cedula').value.trim(),
                fecha_nacimiento: document.getElementById('edit_fecha_nacimiento').value,
                genero: document.getElementById('edit_genero').value,
                cargo: document.getElementById('edit_cargo').value.trim(),
                area_id: document.getElementById('edit_area').value,
                sede_id: document.getElementById('edit_sede').value || null,
                formacion: document.getElementById('edit_formacion').value.trim(),
                nivel_academico: document.getElementById('edit_nivel_academico').value,
                tipo_nombramiento: document.getElementById('edit_tipo_nombramiento').value,
                grado_escalafon: document.getElementById('edit_grado_escalafon').value.trim(),
                horario_atencion: document.getElementById('edit_horario').value.trim(),
                sobre_mi: document.getElementById('edit_sobre_mi').value.trim(),
                email: document.getElementById('edit_email').value.trim(),
                telefono: document.getElementById('edit_telefono').value.trim(),
                visibilidad: { activo: estadoActivo, campos: { ...visibilidadCampos } }
            };

            if (!data.nombre) { alert('⚠️ El nombre es obligatorio'); return; }
            if (!data.cedula) { alert('⚠️ La cédula es obligatoria'); return; }
            if (!data.cargo) { alert('⚠️ El cargo es obligatorio'); return; }
            if (!data.area_id) { alert('⚠️ El área es obligatoria'); return; }
            if (!data.genero) { alert('⚠️ El género es obligatorio'); return; }

            try {
                const response = await fetch(`/api/docentes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.token}`
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Error al actualizar docente');

                // Actualizar materias
                const materiasActualesResp = await fetch(`/api/materias/docente/${id}`, {
                    headers: { 'Authorization': `Bearer ${window.token}` }
                });
                const materiasActuales = await materiasActualesResp.json();
                const materiasActualesIds = materiasActuales.map(m => m.id);

                const materiasAgregar = materiasSeleccionadas.filter(mId => !materiasActualesIds.includes(mId));
                const materiasRemover = materiasActualesIds.filter(mId => !materiasSeleccionadas.includes(mId));

                for (const materiaId of materiasAgregar) {
                    await fetch('/api/materias/asignar', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.token}`
                        },
                        body: JSON.stringify({ docente_id: id, materia_id: materiaId })
                    });
                }

                for (const materiaId of materiasRemover) {
                    await fetch(`/api/materias/asignar/${id}/${materiaId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${window.token}` }
                    });
                }

                // Manejar foto
                if (editPhotoRemoved) {
                    await fetch(`/api/docentes/${id}/foto`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${window.token}` }
                    });
                } else if (editPhotoChanged && editInputFoto && editInputFoto.files.length > 0) {
                    const formData = new FormData();
                    formData.append('foto', editInputFoto.files[0]);
                    await fetch(`/api/docentes/${id}/foto`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${window.token}` },
                        body: formData
                    });
                }

                alert('✅ Docente actualizado exitosamente');
                document.getElementById('modal').style.display = 'none';
                loadDocentes();
                loadDashboard();

            } catch (error) {
                console.error('Error:', error);
                alert('❌ Error: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Error al cargar docente:', error);
        alert('❌ Error al cargar los datos del docente');
    }
};

// ============================================
// ELIMINAR DOCENTE
// ============================================
window.deleteDocente = async function (id) {
    if (confirm('¿Estás seguro de eliminar este docente?')) {
        try {
            const response = await fetch(`/api/docentes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${window.token}` }
            });

            if (response.ok) {
                alert('Docente eliminado exitosamente');
                loadDocentes();
                loadDashboard();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Error al eliminar el docente'));
            }
        } catch (error) {
            alert('Error al eliminar el docente');
        }
    }
};

// ============================================
// VER DETALLES
// ============================================
window.verDetalles = async function (id) {
    try {
        const response = await fetch(`/api/docentes/${id}`, {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const docente = await response.json();

        const fechaNac = docente.fecha_nacimiento
            ? new Date(docente.fecha_nacimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' })
            : 'N/A';

        const content = `
            <div style="padding: 0.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                    <div><strong>ID:</strong> ${docente.id}</div>
                    <div><strong>Nombre:</strong> ${docente.nombre}</div>
                    <div><strong>Cédula:</strong> ${docente.cedula}</div>
                    <div><strong>Área:</strong> ${docente.area_nombre}</div>
                    <div><strong>Sede:</strong> ${docente.sede_nombre || 'N/A'}</div>
                    <div><strong>Cargo:</strong> ${docente.cargo}</div>
                    <div><strong>Género:</strong> ${docente.genero || 'N/A'}</div>
                    <div><strong>Nacimiento:</strong> ${fechaNac}</div>
                    <div><strong>Formación:</strong> ${docente.formacion || 'N/A'}</div>
                    <div><strong>Nivel Académico:</strong> ${docente.nivel_academico || 'N/A'}</div>
                    <div><strong>Grado de Escalafón:</strong> ${docente.grado_escalafon || 'N/A'}</div>
                    <div><strong>Tipo de Vinculación:</strong> ${docente.tipo_nombramiento || 'N/A'}</div>
                    <div><strong>Email:</strong> ${docente.email || 'N/A'}</div>
                    <div><strong>Teléfono:</strong> ${docente.telefono || 'N/A'}</div>
                    <div><strong>Horario:</strong> ${docente.horario_atencion || 'N/A'}</div>
                    <div><strong>Estado:</strong> ${docente.visibilidad?.activo !== false ? '✅ Activo' : '❌ Inactivo'}</div>
                </div>
                ${docente.sobre_mi ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #e2e8f0;"><strong>Sobre mí:</strong> ${docente.sobre_mi}</div>` : ''}
            </div>
        `;

        openModal(`Detalles: ${docente.nombre}`, content);
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        alert('Error al cargar los detalles del docente');
    }
};
