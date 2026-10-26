// ============================================
// portal-horarios.js — Gestión de Horarios
// ============================================

let horarioData = null;

// Catálogo de años escolares cargado desde /api/horarios/anos
let anosDisponibles = [];

// Año escolar elegido en el selector "Seleccionar Año" (cabecera de Horarios).
// Es null mientras el usuario no elija un año.
let horarioAnoActual = null;

// Devuelve el año escolar seleccionado (lo usa portal-init.js)
function getAnoHorarioActual() {
    return horarioAnoActual;
}

// Mensaje según corresponda: sin años configurados en la BD o sin selección
function mensajeErrorAno() {
    return anosDisponibles.length
        ? '⚠️ Selecciona un año escolar'
        : '⚠️ No hay años escolares configurados en el sistema';
}

// Mantiene horarioAnoActual sincronizado con el selector "Seleccionar Año"
function sincronizarAnoSeleccionado() {
    const selectAno = document.getElementById('horarioAno');
    const elegido = selectAno
        ? anosDisponibles.find(a => String(a.id) === String(selectAno.value))
        : null;

    horarioAnoActual = elegido
        ? { id: elegido.id, nombre: `${elegido.nombre} ${elegido.activo ? '✅' : ''}`.trim() }
        : null;
}

document.getElementById('horarioAno')?.addEventListener('change', sincronizarAnoSeleccionado);

// ============================================
// CARGAR SELECTS DE HORARIOS
// ============================================
async function cargarSelectsHorarios() {
    try {
        console.log('🔄 Cargando años escolares...');
        const anosResp = await fetch('/api/horarios/anos');
        if (!anosResp.ok) throw new Error(`Error al cargar años: ${anosResp.status}`);
        const anos = await anosResp.json();
        console.log('✅ Años cargados:', anos);
        anosDisponibles = Array.isArray(anos) ? anos : [];

        // Selector "Seleccionar Año" (cabecera de Horarios)
        const selectAno = document.getElementById('horarioAno');
        if (selectAno) {
            const seleccionPrevia = selectAno.value;
            selectAno.innerHTML = '<option value="">Seleccionar Año</option>';
            anosDisponibles.forEach(a => {
                const option = document.createElement('option');
                option.value = a.id;
                option.textContent = `${a.nombre}${a.activo ? ' ✅' : ''}`;
                selectAno.appendChild(option);
            });
            // Conserva la selección previa si el año sigue disponible
            if (seleccionPrevia && Array.from(selectAno.options).some(o => o.value === seleccionPrevia)) {
                selectAno.value = seleccionPrevia;
            }
        }
        sincronizarAnoSeleccionado();

        console.log('🔄 Cargando docentes...');
        const docentesResp = await fetch('/api/docentes', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        if (!docentesResp.ok) throw new Error(`Error al cargar docentes: ${docentesResp.status}`);
        const docentes = await docentesResp.json();
        console.log('✅ Docentes cargados:', docentes);

        const selectDocente = document.getElementById('horarioDocente');
        if (selectDocente) {
            selectDocente.innerHTML = '<option value="">Seleccionar Docente</option>';
            docentes.forEach(d => {
                const option = document.createElement('option');
                option.value = d.id;
                option.textContent = `${d.nombre} - ${d.area_nombre}`;
                selectDocente.appendChild(option);
            });
        }

    } catch (error) {
        console.error('❌ Error al cargar selects:', error);
        alert('Error al cargar los datos: ' + error.message);
    }
}

// ============================================
// CARGAR HORARIO
// ============================================
async function cargarHorario() {
    const docenteId = document.getElementById('horarioDocente').value;
    const anoId = horarioAnoActual?.id || null;

    if (!docenteId) {
        alert('⚠️ Selecciona un docente');
        return;
    }

    if (!anoId) {
        alert(mensajeErrorAno());
        return;
    }

    try {
        const response = await fetch(`/api/horarios/docente/${docenteId}?ano_id=${anoId}`);
        const data = await response.json();
        horarioData = data;
        renderHorario(data, docenteId, anoId);
    } catch (error) {
        console.error('Error al cargar horario:', error);
        alert('Error al cargar el horario');
    }
}

// ============================================
// RENDERIZAR HORARIO
// ============================================
function renderHorario(horarios, docenteId, anoId) {
    const tbody = document.getElementById('horarioBody');
    if (!tbody) return;

    const docenteNombre = document.getElementById('horarioDocente').selectedOptions[0]?.text || '';
    const anoNombre = horarioAnoActual?.nombre || '';

    const infoNombre = document.getElementById('horarioDocenteNombre');
    const infoAno = document.getElementById('horarioAnoNombre');
    const infoContainer = document.getElementById('horarioInfo');

    if (infoNombre) infoNombre.textContent = `👨‍🏫 ${docenteNombre}`;
    if (infoAno) infoAno.textContent = `📅 ${anoNombre}`;
    if (infoContainer) infoContainer.style.display = 'block';

    const bloques = [
        { num: 1, hora: '6:30 - 7:25' },
        { num: 2, hora: '7:25 - 8:20' },
        { num: 3, hora: '8:20 - 9:15' },
        { num: 4, hora: '9:45 - 10:40' },
        { num: 5, hora: '10:40 - 11:35' },
        { num: 6, hora: '11:35 - 12:30' }
    ];

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    let html = '';

    // Fila de descanso
    html += `
        <div class="horario-row descanso-row">
            <div class="horario-cell" style="background:#fef3c7;font-weight:bold;color:#92400e;">
                <i class="fas fa-coffee"></i> Descanso
            </div>
            <div class="horario-cell" style="background:#fef3c7;font-weight:bold;color:#92400e;">9:15 - 9:45</div>
        <div class="horario-cell descanso" style="grid-column:span 5;background:#fef3c7;text-align:center;color:#92400e;">
            ⏸️ 30 MINUTOS DE DESCANSO
        </div>
        </div>
    `;

    bloques.forEach(bloque => {
        html += `<div class="horario-row">`;
        html += `<div class="horario-cell bloque-num">${bloque.num}</div>`;
        html += `<div class="horario-cell hora">${bloque.hora}</div>`;

        dias.forEach(dia => {
            const clase = horarios.find(h => h.dia_semana === dia && h.bloque === bloque.num);

            if (clase) {
                html += `
                    <div class="horario-cell clase" data-horario-id="${clase.id}"
                         style="background:#dcfce7;border:1px solid #86efac;cursor:pointer;">
                        <strong>${clase.materia_nombre || 'Sin materia'}</strong>
                        <br><small>${clase.curso || ''}</small>
                        <br><small style="color:#64748b;">${clase.salon || ''}</small>
                        <div style="font-size:0.7rem;color:#64748b;margin-top:4px;">
                            <i class="fas fa-edit"></i> Click para editar
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="horario-cell vacio" data-dia="${dia}" data-bloque="${bloque.num}"
                         style="background:#f1f5f9;cursor:pointer;border:1px dashed #cbd5e1;">
                        <span style="color:#94a3b8;font-size:0.8rem;">
                            <i class="fas fa-plus-circle"></i> Asignar
                        </span>
                    </div>
                `;
            }
        });

        html += `</div>`;
    });

    tbody.innerHTML = html;
}

// ============================================
// EVENT DELEGATION para clicks en horario
// (evita inline onclick — compatible con CSP)
// ============================================
document.getElementById('horarioBody').addEventListener('click', function (e) {
    const cell = e.target.closest('.horario-cell.clase, .horario-cell.vacio');
    if (!cell) return;

    const horarioId = cell.dataset.horarioId;
    const dia = cell.dataset.dia;
    const bloque = cell.dataset.bloque;

    if (horarioId) {
        editarHorario(parseInt(horarioId));
    } else if (dia && bloque) {
        agregarHorario(dia, parseInt(bloque));
    }
});

// ============================================
// AGREGAR HORARIO
// ============================================
function agregarHorario(dia, bloque) {
    console.log('📝 Agregando horario:', dia, 'Bloque:', bloque);

    const docenteId = document.getElementById('horarioDocente')?.value;
    const anoId = horarioAnoActual?.id || null;

    if (!docenteId) {
        alert('⚠️ Primero selecciona un docente');
        return;
    }

    if (!anoId) {
        alert(mensajeErrorAno());
        return;
    }

    fetch('/api/materias')
        .then(r => {
            if (!r.ok) throw new Error('Error al cargar materias');
            return r.json();
        })
        .then(materias => {
            const materiaOptions = materias.map(m =>
                `<option value="${m.id}">${m.nombre}</option>`
            ).join('');

            openModal('Asignar Clase', `
                <form id="horarioForm">
                    <div style="background:#f0fdf4;padding:0.8rem 1rem;border-radius:8px;margin-bottom:1rem;border-left:4px solid #22c55e;">
                        <p style="margin:0;font-size:0.9rem;"><strong>📅 ${dia} - Bloque ${bloque}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Materia *</label>
                        <select id="h_materia" required>
                            <option value="">Seleccionar materia</option>
                            ${materiaOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Curso</label>
                        <input type="text" id="h_curso" placeholder="Ej: 1102, 1001">
                    </div>
                    <div class="form-group">
                        <label>Salón</label>
                        <input type="text" id="h_salon" placeholder="Ej: 101">
                    </div>
                    <button type="submit" class="btn-primary btn-block"><i class="fas fa-save"></i> Guardar Horario</button>
                </form>
            `);

            const form = document.getElementById('horarioForm');
            if (form) {
                form.addEventListener('submit', async function (e) {
                    e.preventDefault();

                    const materia_id = parseInt(document.getElementById('h_materia').value);
                    if (!materia_id) { alert('Selecciona una materia'); return; }

                    const data = {
                        docente_id: parseInt(docenteId),
                        ano_id: parseInt(anoId),
                        dia_semana: dia,
                        bloque: bloque,
                        materia_id: materia_id,
                        curso: document.getElementById('h_curso').value || null,
                        salon: document.getElementById('h_salon').value || null
                    };

                    try {
                        const response = await fetch('/api/horarios', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${window.token}`
                            },
                            body: JSON.stringify(data)
                        });

                        const result = await response.json();

                        if (response.ok) {
                            alert('✅ Clase asignada exitosamente');
                            document.getElementById('modal').style.display = 'none';
                            cargarHorario();
                        } else {
                            alert('❌ Error: ' + (result.error || 'Error al crear horario'));
                        }
                    } catch (error) {
                        console.error('❌ Error:', error);
                        alert('Error al guardar el horario');
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Error al cargar materias:', error);
            alert('Error al cargar las materias');
        });
}

// ============================================
// EDITAR HORARIO
// ============================================
window.editarHorario = function (horarioId) {
    console.log('✏️ Editando horario ID:', horarioId);
    console.log('📦 horarioData:', horarioData);

    if (!horarioData || !Array.isArray(horarioData)) {
        console.error('❌ horarioData no está cargado. Ejecuta "Cargar" primero.');
        alert('❌ No hay datos de horario cargados. Haz clic en "Cargar" primero.');
        return;
    }

    const horario = horarioData.find(h => h.id === horarioId);
    if (!horario) {
        console.error('❌ Horario con ID', horarioId, 'no encontrado en horarioData:', horarioData);
        alert('❌ No se encontró el horario (ID: ' + horarioId + ')');
        return;
    }

    fetch('/api/materias')
        .then(r => {
            if (!r.ok) throw new Error('Error al cargar materias');
            return r.json();
        })
        .then(materias => {
            const materiaOptions = materias.map(m =>
                `<option value="${m.id}" ${m.id === horario.materia_id ? 'selected' : ''}>${m.nombre}</option>`
            ).join('');

            openModal('Editar Horario', `
                <form id="editHorarioForm">
                    <div style="background:#f0fdf4;padding:0.8rem 1rem;border-radius:8px;margin-bottom:1rem;border-left:4px solid #22c55e;">
                        <p style="margin:0;font-size:0.9rem;"><strong>📅 ${horario.dia_semana} - Bloque ${horario.bloque}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>Materia *</label>
                        <select id="eh_materia" required>
                            <option value="">Seleccionar materia</option>
                            ${materiaOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Curso</label>
                        <input type="text" id="eh_curso" value="${horario.curso || ''}" placeholder="Ej: 1102, 1001">
                    </div>
                    <div class="form-group">
                        <label>Salón</label>
                        <input type="text" id="eh_salon" value="${horario.salon || ''}" placeholder="Ej: 101">
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <button type="submit" class="btn-primary" style="flex:1;"><i class="fas fa-save"></i> Actualizar</button>
                        <button type="button" data-action="delete-horario" data-id="${horarioId}" class="btn-danger" style="flex:0.5;"><i class="fas fa-trash"></i> Eliminar</button>
                    </div>
                </form>
            `);

            const form = document.getElementById('editHorarioForm');
            if (form) {
                form.addEventListener('submit', async function (e) {
                    e.preventDefault();

                    const data = {
                        dia_semana: horario.dia_semana,
                        bloque: horario.bloque,
                        materia_id: parseInt(document.getElementById('eh_materia').value),
                        curso: document.getElementById('eh_curso').value || null,
                        salon: document.getElementById('eh_salon').value || null
                    };

                    try {
                        const response = await fetch(`/api/horarios/${horarioId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${window.token}`
                            },
                            body: JSON.stringify(data)
                        });

                        const result = await response.json();

                        if (response.ok) {
                            alert('✅ Horario actualizado exitosamente');
                            document.getElementById('modal').style.display = 'none';
                            cargarHorario();
                        } else {
                            alert('❌ Error: ' + (result.error || 'Error al actualizar horario'));
                        }
                    } catch (error) {
                        console.error('❌ Error:', error);
                        alert('Error al actualizar horario');
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Error al cargar materias:', error);
            alert('Error al cargar las materias');
        });
};

// ============================================
// EVENT DELEGATION — Acciones en modal de horarios (CSP-safe)
// ============================================
document.getElementById('modalBody')?.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'close') { cerrarModalResultado(); return; }
    if (!id) return;
    if (action === 'delete-horario') eliminarHorario(parseInt(id));
});

// ============================================
// ELIMINAR HORARIO
// ============================================
window.eliminarHorario = async function (horarioId) {
    if (!confirm('¿Estás seguro de eliminar esta clase del horario?')) return;

    try {
        const response = await fetch(`/api/horarios/${horarioId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${window.token}` }
        });

        if (response.ok) {
            alert('✅ Horario eliminado exitosamente');
            document.getElementById('modal').style.display = 'none';
            cargarHorario();
        } else {
            const result = await response.json();
            alert('❌ Error: ' + (result.error || 'Error al eliminar horario'));
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al eliminar horario');
    }
};
