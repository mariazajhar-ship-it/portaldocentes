// ============================================
// portal-init.js — Inicialización global
// ============================================

// ============================================
// TABS
// ============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const tabId = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) targetTab.classList.add('active');

        if (tabId === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
        if (tabId === 'docentes' && typeof loadDocentes === 'function') loadDocentes();
        if (tabId === 'areas' && typeof loadAreas === 'function') loadAreas();
        if (tabId === 'materias' && typeof loadMaterias === 'function') loadMaterias();
        if (tabId === 'sedes' && typeof loadSedes === 'function') loadSedes();
        if (tabId === 'contacto' && typeof loadContacto === 'function') loadContacto();
        if (tabId === 'horarios') {
            if (typeof cargarSelectsHorarios === 'function') cargarSelectsHorarios();
            const hDocente = document.getElementById('horarioDocente');
            const hAno = (typeof getAnoHorarioActual === 'function') ? getAnoHorarioActual() : null;
            if (hDocente && hAno && hDocente.value && hAno.id) {
                cargarHorario();
            }
        }
    });
});

// ============================================
// BOTÓN NUEVO DOCENTE
// ============================================
document.getElementById('btnNewDocente')?.addEventListener('click', () => {
    // Estado de los candados de visibilidad pública (todos abiertos por defecto)
    const visibilidadCampos = estadoVisibilidad(null);

    openModal('Nuevo Docente', `
        <form id="docenteForm">
            <div style="background:#f1f5f9;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-user"></i> Datos Personales</h4>
                <div class="form-row">
                    <div class="form-group"><label>Nombre Completo</label><input type="text" id="doc_nombre" placeholder="Nombre completo" required></div>
                    <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Cédula *</label><input type="text" id="doc_cedula" placeholder="Número de cédula" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Fecha de Nacimiento *</label><input type="date" id="doc_fecha_nacimiento"></div>                        <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Género *</label>
                        <select id="doc_genero" required>
                            <option value="">Seleccionar</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                    </div>
                </div>
                <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Cargo *</label><input type="text" id="doc_cargo" placeholder="Ej: Docente" required></div>
            </div>

            <div style="background:#f0fdf4;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-graduation-cap"></i> Datos Académicos</h4>
                <div class="form-row">
                    <div class="form-group"><label>Área * ${candadoHTML('area', visibilidadCampos.area)}</label><select id="doc_area" required><option value="">Seleccionar área</option></select></div>
                    <div class="form-group"><label>Sede</label><select id="doc_sede"><option value="">Seleccionar sede</option></select></div>
                    <div class="form-group"><label>Formación ${candadoHTML('formacion', visibilidadCampos.formacion)}</label><input type="text" id="doc_formacion" placeholder="Ej: Licenciado en Matemáticas"></div>
                    <div class="form-group"><label>Nivel Académico ${candadoHTML('nivel_academico', visibilidadCampos.nivel_academico)}</label>
                        <select id="doc_nivel_academico">
                            <option value="">Seleccionar nivel</option>
                            <option value="Licenciatura / Profesional">Licenciatura / Profesional</option>
                            <option value="Especialización">Especialización</option>
                            <option value="Maestría / Magister">Maestría / Magister</option>
                            <option value="Doctorado">Doctorado</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label title="Información privada: nunca se muestra en el portal público">Grado de Escalafón *</label><input type="text" id="doc_grado_escalafon" placeholder="GRADO 2 NIVEL A" maxlength="100"></div>
                    <div class="form-group">
                        <label title="Información privada: nunca se muestra en el portal público">Tipo de Vinculación *</label>
                        <select id="doc_tipo_nombramiento">
                            <option value="Propiedad">Propiedad</option>
                            <option value="Traslado en Propiedad">Traslado en Propiedad</option>
                            <option value="Provisional">Provisional</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="background:#eff6ff;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-address-card"></i> Datos de Contacto</h4>
                <div class="form-row">
                    <div class="form-group"><label>Email ${candadoHTML('email', visibilidadCampos.email)}</label><input type="email" id="doc_email" placeholder="email@liceo.edu"></div>
                    <div class="form-group"><label>Teléfono ${candadoHTML('telefono', visibilidadCampos.telefono)}</label><input type="text" id="doc_telefono" placeholder="Número de teléfono"></div>
                </div>
            </div>

            <div style="background:#fef3c7;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-clock"></i> Datos Laborales</h4>
                <div class="form-group"><label>Horario de Atención ${candadoHTML('horario_atencion', visibilidadCampos.horario_atencion)}</label><input type="text" id="doc_horario" placeholder="Ej: Lunes a Viernes 8am-12pm"></div>
                <div class="form-group"><label>Sobre mí</label><textarea id="doc_sobre_mi" placeholder="Breve descripción del docente" rows="3"></textarea></div>
            </div>

            <div style="background:#e8f5e9;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <h4 style="color:var(--primary-color);margin-bottom:0.5rem;"><i class="fas fa-camera"></i> Foto del Docente</h4>
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div id="create_foto_preview" style="width:80px;height:80px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px solid #e2e8f0;">
                        <i class="fas fa-user" style="font-size:2rem;color:#94a3b8;"></i>
                    </div>
                    <div style="flex:1;">
                        <input type="file" id="doc_foto" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;">
                        <button type="button" id="btn_select_foto_create" class="btn-primary" style="padding:0.5rem 1rem;font-size:0.9rem;"><i class="fas fa-upload"></i> Seleccionar Foto</button>
                        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem;">JPG, PNG, GIF o WebP. Máximo 2 MB.</p>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn-primary btn-block"><i class="fas fa-save"></i> Guardar Docente</button>
        </form>
    `);

    // Candados de visibilidad pública (guardados por docente)
    activarCandados('docenteForm', visibilidadCampos);

    // Configurar botón de selección de foto y preview
    const btnSelectFoto = document.getElementById('btn_select_foto_create');
    const inputFoto = document.getElementById('doc_foto');
    const fotoPreview = document.getElementById('create_foto_preview');

    if (btnSelectFoto && inputFoto) {
        btnSelectFoto.addEventListener('click', () => inputFoto.click());
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert('⚠️ La imagen no debe superar los 2 MB');
                    inputFoto.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    fotoPreview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Cargar áreas en el select
    fetch('/api/areas')
        .then(r => r.json())
        .then(areas => {
            const select = document.getElementById('doc_area');
            if (select) {
                areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.id;
                    option.textContent = area.nombre;
                    select.appendChild(option);
                });
            }
        });

    // Cargar sedes en el select
    fetch('/api/sedes?activos=true')
        .then(r => r.json())
        .then(sedes => {
            const select = document.getElementById('doc_sede');
            if (select) {
                sedes.forEach(sede => {
                    const option = document.createElement('option');
                    option.value = sede.id;
                    option.textContent = sede.nombre;
                    select.appendChild(option);
                });
            }
        });

    // Manejar submit
    document.getElementById('docenteForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();            const data = {
                nombre: document.getElementById('doc_nombre').value,
                cedula: document.getElementById('doc_cedula').value,
                fecha_nacimiento: document.getElementById('doc_fecha_nacimiento').value,
                genero: document.getElementById('doc_genero').value,
                cargo: document.getElementById('doc_cargo').value,
                area_id: document.getElementById('doc_area').value,
                sede_id: document.getElementById('doc_sede').value || null,
                formacion: document.getElementById('doc_formacion').value,
                nivel_academico: document.getElementById('doc_nivel_academico').value,
                tipo_nombramiento: document.getElementById('doc_tipo_nombramiento').value,
                grado_escalafon: document.getElementById('doc_grado_escalafon').value,
                horario_atencion: document.getElementById('doc_horario').value,
                sobre_mi: document.getElementById('doc_sobre_mi').value,
                email: document.getElementById('doc_email').value,
                telefono: document.getElementById('doc_telefono').value,
                visibilidad: { activo: true, campos: { ...visibilidadCampos } }
            };

        if (!data.nombre || !data.cedula || !data.cargo || !data.area_id || !data.genero) {
            alert('Por favor completa todos los campos obligatorios (*)');
            return;
        }

        try {
            const response = await fetch('/api/docentes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                const fotoInput = document.getElementById('doc_foto');
                if (fotoInput && fotoInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('foto', fotoInput.files[0]);

                    try {
                        const fotoResp = await fetch(`/api/docentes/${result.docente.id}/foto`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${window.token}` },
                            body: formData
                        });
                        if (fotoResp.ok) {
                            alert(`✅ Docente creado exitosamente con foto.\nID: ${result.docente.id}\nCédula: ${result.docente.cedula}`);
                        } else {
                            alert(`✅ Docente creado, pero hubo un error al subir la foto.\nID: ${result.docente.id}`);
                        }
                    } catch (fotoError) {
                        console.error('Error al subir foto:', fotoError);
                        alert(`✅ Docente creado, pero hubo un error al subir la foto.\nID: ${result.docente.id}`);
                    }
                } else {
                    alert(`✅ Docente creado exitosamente.\nID: ${result.docente.id}\nCédula: ${result.docente.cedula}`);
                }

                document.getElementById('modal').style.display = 'none';
                loadDocentes();
                loadDashboard();
            } else {
                alert('❌ Error: ' + (result.error || 'Error al crear docente'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al conectar con el servidor');
        }
    });
});

// ============================================
// BOTÓN NUEVA ÁREA
// ============================================
document.getElementById('btnNewArea')?.addEventListener('click', () => {
    openModal('Nueva Área', `
        <form id="areaForm">
            <div class="form-group"><label>ID *</label><input type="text" id="area_id" placeholder="Ej: matemáticas" required></div>
            <div class="form-group"><label>Nombre *</label><input type="text" id="area_nombre" placeholder="Ej: Matemáticas" required></div>
            <div class="form-group"><label>Icono</label><input type="text" id="area_icono" placeholder="Ej: sigma"></div>
            <div class="form-group"><label>Descripción</label><textarea id="area_descripcion" placeholder="Descripción del área"></textarea></div>
            <div class="form-group"><label><input type="checkbox" id="area_popular"> Popular</label></div>
            <button type="submit" class="btn-primary btn-block"><i class="fas fa-save"></i> Guardar Área</button>
        </form>
    `);

    document.getElementById('areaForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            id: document.getElementById('area_id').value,
            nombre: document.getElementById('area_nombre').value,
            icono: document.getElementById('area_icono').value,
            descripcion: document.getElementById('area_descripcion').value,
            popular: document.getElementById('area_popular').checked
        };

        try {
            const response = await fetch('/api/areas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Área creada exitosamente');
                document.getElementById('modal').style.display = 'none';
                loadAreas();
                loadDashboard();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Error al guardar el área');
        }
    });
});

// ============================================
// BOTÓN NUEVA SEDE
// ============================================
document.getElementById('btnNewSede')?.addEventListener('click', () => {
    openModal('Nueva Sede', `
        <form id="sedeForm">
            <div style="background:#f1f5f9;padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <h4 style="color:var(--primary-color);margin-bottom:1rem;"><i class="fas fa-map-marker-alt"></i> Datos de la Sede</h4>
                <div class="form-group"><label>Nombre de la Sede *</label><input type="text" id="sede_nombre" placeholder="Ej: Sede Principal" required></div>
                <div class="form-group"><label>Dirección</label><input type="text" id="sede_direccion" placeholder="Dirección de la sede"></div>
                <div class="form-group"><label>Descripción</label><textarea id="sede_descripcion" placeholder="Descripción de la sede" rows="3"></textarea></div>
            </div>
            <button type="submit" class="btn-primary btn-block"><i class="fas fa-save"></i> Guardar Sede</button>
        </form>
    `);

    document.getElementById('sedeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('sede_nombre').value.trim(),
            direccion: document.getElementById('sede_direccion').value.trim(),
            descripcion: document.getElementById('sede_descripcion').value.trim()
        };

        if (!data.nombre) { alert('⚠️ El nombre de la sede es obligatorio'); return; }

        try {
            const response = await fetch('/api/sedes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.token}`
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                alert(`✅ Sede "${data.nombre}" creada exitosamente`);
                document.getElementById('modal').style.display = 'none';
                loadSedes();
                loadDashboard();
            } else {
                alert('❌ Error: ' + (result.error || 'Error al crear sede'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al conectar con el servidor');
        }
    });
});

// ============================================
// BOTÓN NUEVA MATERIA
// ============================================
document.getElementById('btnNewMateria')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/areas', {
            headers: { 'Authorization': `Bearer ${window.token}` }
        });
        const areas = await response.json();

        const areaOptions = areas.map(area =>
            `<option value="${area.id}">${area.nombre}</option>`
        ).join('');

        openModal('Nueva Materia', `
            <form id="materiaForm">
                <div class="form-group"><label>Nombre de la Materia *</label><input type="text" id="materia_nombre" placeholder="Ej: Álgebra" required></div>
                <div class="form-group"><label>Área *</label><select id="materia_area" required><option value="">Seleccionar área</option>${areaOptions}</select></div>
                <button type="submit" class="btn-primary btn-block"><i class="fas fa-save"></i> Guardar Materia</button>
            </form>
        `);

        document.getElementById('materiaForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('materia_nombre').value;
            const area_id = document.getElementById('materia_area').value;

            if (!nombre || nombre.trim() === '') { alert('Por favor ingresa el nombre de la materia'); return; }
            if (!area_id) { alert('Por favor selecciona un área'); return; }

            try {
                const resp = await fetch('/api/materias', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.token}`
                    },
                    body: JSON.stringify({ nombre, area_id })
                });
                const result = await resp.json();
                if (resp.ok) {
                    alert(`✅ Materia "${nombre}" creada exitosamente`);
                    document.getElementById('modal').style.display = 'none';
                    loadMaterias();
                    loadDashboard();
                } else {
                    alert('❌ Error: ' + (result.error || 'Error al crear materia'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Error al conectar con el servidor');
            }
        });
    } catch (error) {
        console.error('Error al cargar áreas:', error);
        alert('Error al cargar las áreas');
    }
});

// ============================================
// EVENTOS DE FILTRO EN MATERIAS Y HORARIOS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Configurando eventos del DOM...');

    // Eventos de materias
    const searchInput = document.getElementById('searchMateria');
    const filterArea = document.getElementById('filterMateriaArea');

    if (searchInput) searchInput.addEventListener('input', filtrarMaterias);
    if (filterArea) filterArea.addEventListener('change', filtrarMaterias);

    // Botón Asignar Clase (Horarios)
    const btnNew = document.getElementById('btnNewHorario');
    if (btnNew) {
        btnNew.addEventListener('click', function () {
            const docenteId = document.getElementById('horarioDocente')?.value;
            const anoActual = (typeof getAnoHorarioActual === 'function') ? getAnoHorarioActual() : null;

            if (!docenteId) {
                alert('⚠️ Primero selecciona un docente');
                return;
            }

            if (!anoActual?.id) {
                alert(typeof mensajeErrorAno === 'function' ? mensajeErrorAno() : '⚠️ Selecciona un año escolar');
                return;
            }

            const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            const bloques = [1, 2, 3, 4, 5, 6];

            let options = '<option value="">Seleccionar...</option>';
            dias.forEach(dia => {
                bloques.forEach(bloque => {
                    options += `<option value="${dia}|${bloque}">${dia} - Bloque ${bloque}</option>`;
                });
            });

            openModal('Nuevo Horario', `
                <form id="newHorarioForm">
                    <div class="form-group">
                        <label>Día y Bloque *</label>
                        <select id="nh_dia_bloque" required>${options}</select>
                    </div>
                    <button type="submit" class="btn-primary btn-block"><i class="fas fa-arrow-right"></i> Continuar</button>
                </form>
            `);

            const form = document.getElementById('newHorarioForm');
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const value = document.getElementById('nh_dia_bloque').value;
                    if (!value) { alert('Selecciona un día y bloque'); return; }
                    const [dia, bloque] = value.split('|');
                    document.getElementById('modal').style.display = 'none';
                    agregarHorario(dia, parseInt(bloque));
                });
            }
        });
    }

    // Botón Cargar Horario
    const btnCargar = document.getElementById('btnCargarHorario');
    if (btnCargar) {
        btnCargar.addEventListener('click', cargarHorario);
    }
});

// ============================================
// INICIALIZAR
// ============================================
(async () => {
    const authed = await checkAuth();
    if (!authed) {
        showLoginPanel();
    } else {
        showAdminPanel();
        setTimeout(() => {
            if (typeof cargarSelectsHorarios === 'function') cargarSelectsHorarios();
        }, 500);
    }
})();
