document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del docente desde la URL
    // URL esperada: /docente/12
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const docenteId = pathParts.pop();

    if (!docenteId || isNaN(docenteId)) {
        document.body.innerHTML = `
            <div style="text-align:center;padding:5rem;font-family:sans-serif;color:#333;">
                <h2>❌ Error: ID de docente no válido</h2>
                <a href="/" style="color:#2d6a4f;font-weight:bold;text-decoration:none;display:inline-block;margin-top:1rem;">Volver a Inicio</a>
            </div>
        `;
        return;
    }

    try {
        // 2. Obtener datos del docente desde la API pública (perfil individual)
        const response = await fetch(`/api/docentes/publicos/${docenteId}`);
        if (response.status === 404) {
            document.body.innerHTML = `
                <div style="text-align:center;padding:5rem;font-family:sans-serif;color:#333;">
                    <h2>❌ Error: Docente no encontrado</h2>
                    <a href="/" style="color:#2d6a4f;font-weight:bold;text-decoration:none;display:inline-block;margin-top:1rem;">Volver a Inicio</a>
                </div>
            `;
            return;
        }
        if (!response.ok) throw new Error('Error al cargar la información del docente');
        
        const docente = await response.json();

        // 3. Poblar información del perfil del docente en el DOM
        document.title = `${docente.nombre} - Perfil del Docente - Liceo Tame`;
        document.getElementById('docente-nombre').textContent = docente.nombre;

        // Cargo: información privada, nunca llega desde la API pública
        const cargoEl = document.getElementById('docente-cargo');
        if (docente.cargo) cargoEl.textContent = docente.cargo;
        else cargoEl.style.display = 'none';
        
        // Sobre mí
        document.getElementById('docente-sobre-mi').textContent = docente.sobre_mi 
            ? `"${docente.sobre_mi}"` 
            : `${docente.nombre} es un docente comprometido de nuestra institución, enfocado en el desarrollo académico e integral de sus estudiantes.`;

        // Datos de Información General (la Sede siempre se muestra)
        document.getElementById('info-sede').textContent = docente.sede_nombre || 'No especificada';
        mostrarCampoPublico(docente, 'formacion', 'info-formacion', 'No especificada');
        mostrarCampoPublico(docente, 'nivel_academico', 'info-nivel-academico', 'No especificado');

        // Datos de contacto y atención
        mostrarCampoPublico(docente, 'email', 'docente-email', 'N/A');
        mostrarCampoPublico(docente, 'telefono', 'docente-telefono', 'N/A');
        mostrarCampoPublico(docente, 'horario_atencion', 'docente-atencion-horas', 'No definido');

        // Foto de Perfil / Avatar
        const photoContainer = document.getElementById('profile-photo-container');
        if (docente.foto_url) {
            photoContainer.innerHTML = `<img src="${docente.foto_url}" class="profile-photo" alt="${docente.nombre}">`;
        } else {
            // El género es información privada: el avatar es neutro
            photoContainer.innerHTML = `
                <div class="avatar-placeholder">
                    <i class="fas fa-user-tie"></i>
                </div>
            `;
        }

        // Materias que enseña
        const materiasContainer = document.getElementById('materias-container');
        materiasContainer.innerHTML = '';
        if (docente.materias) {
            const materiasList = docente.materias.split(', ');
            materiasList.forEach(materia => {
                const badge = document.createElement('span');
                badge.className = 'badge-materia-profile';
                badge.textContent = materia;
                materiasContainer.appendChild(badge);
            });
        } else {
            materiasContainer.innerHTML = '<span class="no-data">Ninguna materia asignada</span>';
        }

        // 4. Obtener y renderizar el horario de clases
        await loadHorario(docenteId);

        // 5. Configurar navegación suave con pestañas de anclaje
        setupAnchorLinks();

    } catch (error) {
        console.error('Error al inicializar el perfil del docente:', error);
        document.body.innerHTML = `
            <div style="text-align:center;padding:5rem;font-family:sans-serif;color:#333;">
                <h2>❌ Error al conectar con el servidor</h2>
                <p>${error.message}</p>
                <a href="/" style="color:#2d6a4f;font-weight:bold;text-decoration:none;display:inline-block;margin-top:1rem;">Volver a Inicio</a>
            </div>
        `;
    }
});

// ============================================
// VISIBILIDAD DE CAMPOS SEGÚN CANDADO DEL ADMINISTRADOR
// ============================================
// Si el administrador cerró el candado del campo, la clave no viaja en la
// respuesta pública: se oculta toda la fila en lugar de inventar un texto.
function mostrarCampoPublico(docente, campo, id, textoVacio) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!(campo in docente)) {
        const fila = el.closest('.general-info-item') || el.closest('.contact-item') || el.closest('section') || el;
        fila.style.display = 'none';
        return;
    }

    el.textContent = docente[campo] || textoVacio;
}

// ============================================
// CARGAR Y RENDERIZAR HORARIO
// ============================================
async function loadHorario(docenteId) {
    const tbody = document.getElementById('profile-horario-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#888;"><i class="fas fa-spinner fa-spin"></i> Cargando horario...</td></tr>';
    
    try {
        // Obtenemos el horario del docente desde el endpoint público
        const response = await fetch(`/api/horarios/docente/${docenteId}`);
        if (!response.ok) throw new Error('No se pudo obtener el horario');
        
        const horarioData = await response.json();
        
        // Bloques escolares
        const bloques = [
            { num: 1, hora: '6:30 - 7:25' },
            { num: 2, hora: '7:25 - 8:20' },
            { num: 3, hora: '8:20 - 9:15' },
            // El recreo/descanso se inserta estáticamente en medio
            { num: 4, hora: '9:45 - 10:40' },
            { num: 5, hora: '10:40 - 11:35' },
            { num: 6, hora: '11:35 - 12:30' }
        ];

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        let html = '';

        bloques.forEach((bloque, index) => {
            // Insertar descanso entre el bloque 3 y 4
            if (index === 3) {
                html += `
                    <tr class="descanso-row">
                        <td class="col-center">-</td>
                        <td class="col-center select-time">9:15 - 9:45</td>
                        <td colspan="5" class="descanso-label">
                            <i class="fas fa-coffee"></i> ☕ RECESO / DESCANSO
                        </td>
                    </tr>
                `;
            }

            html += `<tr>`;
            html += `<td class="col-center col-block">${bloque.num}</td>`;
            html += `<td class="col-center col-time">${bloque.hora}</td>`;

            dias.forEach(dia => {
                const clase = horarioData.find(h => 
                    h.dia_semana === dia && h.bloque === bloque.num
                );

                if (clase) {
                    html += `
                        <td class="cell-clase">
                            <div class="clase-info">
                                <span class="materia-name">${clase.materia_nombre || 'Clase'}</span>
                                <span class="curso-badge">${clase.curso || ''}</span>
                                ${clase.salon ? `<span class="salon-label"><i class="fas fa-map-marker-alt"></i> ${clase.salon}</span>` : ''}
                            </div>
                        </td>
                    `;
                } else {
                    html += `<td class="cell-vacia">-</td>`;
                }
            });

            html += `</tr>`;
        });

        tbody.innerHTML = html;

    } catch (error) {
        console.error('Error al cargar el horario:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:red;"><i class="fas fa-exclamation-triangle"></i> Error al cargar el horario.</td></tr>';
    }
}

// ============================================
// CONFIGURAR ENLACES DE ANCLAJE RÁPIDO
// ============================================
function setupAnchorLinks() {
    const links = document.querySelectorAll('.anchor-link');
    const sections = Array.from(links).map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Scroll suave a la sección
                window.scrollTo({
                    top: targetSection.offsetTop - 120, // offset para el sticky header
                    behavior: 'smooth'
                });
                
                // Activar pestaña actual
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Cambiar la pestaña activa dinámicamente según el scroll del usuario
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 180; // offset

        sections.forEach(section => {
            if (scrollPosition >= section.offsetTop) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            links.forEach(link => {
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    });
}
