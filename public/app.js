// ============================================
// VARIABLES GLOBALES
// ============================================
const container = document.getElementById('teachers-container');
const countElement = document.getElementById('results-count');
const searchName = document.getElementById('search-name');
const filterArea = document.getElementById('filter-area');
const filterLevel = document.getElementById('filter-level');
const filterGender = document.getElementById('filter-gender');
const filterSede = document.getElementById('filter-sede');

// Elementos de la nueva interfaz
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');
const heroSearchInput = document.getElementById('hero-search-input');
const heroSearchBtn = document.getElementById('hero-search-btn');
const popularAreasContainer = document.getElementById('popularAreas');
const statDocentesCount = document.getElementById('stat-docentes-count');
const statAreasCount = document.getElementById('stat-areas-count');
const headerDocentesCount = document.getElementById('header-docentes-count');

let todosLosDocentes = [];  // Guardar todos los docentes para la carga inicial / contadores

// ============================================
// LÓGICA DE PESTAÑAS (TABS)
// ============================================
function switchTab(tabId) {
    // Cambiar clases de las pestañas
    tabLinks.forEach(link => {
        if (link.dataset.tab === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Cambiar clases del contenido
    tabContents.forEach(content => {
        if (content.id === `tab-${tabId}`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Actualizar la URL con el hash sin recargar la página
    history.replaceState(null, '', `/#tab-${tabId}`);

    // Scroll suave al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Agregar eventos a los enlaces de pestañas
tabLinks.forEach(link => {
    link.addEventListener('click', () => {
        switchTab(link.dataset.tab);
    });
});

// ============================================
// CARGAR ÁREAS
// ============================================
async function loadAreas() {
    try {
        const response = await fetch('/api/areas');
        const areas = await response.json();
        
        // Llenar select de filtros
        const select = document.getElementById('filter-area');
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nombre;
            select.appendChild(option);
        });

        // Cargar sedes
        await loadSedes();

        // Actualizar contador de áreas en Inicio
        if (statAreasCount) {
            statAreasCount.textContent = areas.length;
        }

        // Crear botones de categorías populares en la pestaña Inicio
        if (popularAreasContainer) {
            popularAreasContainer.innerHTML = '';
            areas.forEach(area => {
                if (area.popular) {  // Solo áreas populares
                    const btn = document.createElement('button');
                    btn.className = 'popular-btn';
                    btn.dataset.area = area.id;
                    btn.innerHTML = `<span class="pop-icon">${getAreaEmoji(area.nombre)}</span> ${area.nombre}`;
                    
                    btn.addEventListener('click', function() {
                        // Seleccionar área en el filtro y ejecutar búsqueda
                        filterArea.value = area.id;
                        switchTab('docentes');
                        fetchDocentes();
                    });
                    
                    popularAreasContainer.appendChild(btn);
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

// Cargar sedes
// ============================================
async function loadSedes() {
    try {
        const response = await fetch('/api/sedes?activos=true');
        const sedes = await response.json();

        const select = document.getElementById('filter-sede');
        if (!select) return;

        sedes.forEach(sede => {
            const option = document.createElement('option');
            option.value = sede.id;
            option.textContent = sede.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar sedes:', error);
    }
}

// ============================================
// Helper para obtener un emoji representativo de cada área
function getAreaEmoji(name) {
    const n = name.toLowerCase();
    if (n.includes('matemat') || n.includes('matemát')) return 'Σ';
    if (n.includes('cienc')) return '🔬';
    if (n.includes('lengua') || n.includes('castella') || n.includes('español')) return '📖';
    if (n.includes('ingl') || n.includes('idioma')) return '🔤';
    if (n.includes('social') || n.includes('histor')) return '🌐';
    if (n.includes('art')) return '🎨';
    if (n.includes('educ') || n.includes('físic') || n.includes('fisic')) return '⚽';
    if (n.includes('tecnol') || n.includes('sistem') || n.includes('informát') || n.includes('informat')) return '💻';
    return '📚';
}

// ============================================
// FETCH DOCENTES (CON FILTROS)
// ============================================
async function fetchDocentes(isInitialLoad = false) {
    const nombre = searchName.value;
    const area = filterArea.value;
    const sede = filterSede.value;
    const nivel = filterLevel.value;
    const genero = filterGender.value;

    try {
        // URLSearchParams codifica cada parámetro automáticamente (acentos, espacios, etc.)
        const params = new URLSearchParams({ nombre, area, sede, nivel, genero });
        const response = await fetch(`/api/docentes/publicos?${params}`);
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        
        const docentes = await response.json();
        
        if (isInitialLoad) {
            todosLosDocentes = docentes; // Guardamos todos los docentes activos sin filtrar
            // Actualizar contadores totales
            if (statDocentesCount) statDocentesCount.textContent = docentes.length;
            if (headerDocentesCount) headerDocentesCount.textContent = docentes.length;
        }
        
        renderTeachers(docentes);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        countElement.textContent = "Error al conectar con el servidor.";
    }
}

// ============================================
// RENDERIZAR TARJETAS
// ============================================
function renderTeachers(docentes) {
    container.innerHTML = '';
    
    if (!docentes || docentes.length === 0) {
        countElement.textContent = `No se encontraron docentes`;
        container.innerHTML = `
            <div class="no-results">
                <i class="fa-solid fa-user-slash"></i>
                <p>No se encontraron docentes con los filtros seleccionados.</p>                <button class="btn-primary btn-limpiar-noresults" style="margin-top:1rem;">
                        <i class="fas fa-undo"></i> Limpiar filtros
                    </button>
            </div>`;
        return;
    }

    countElement.textContent = `📌 Docentes encontrados: ${docentes.length}`;

    docentes.forEach(docente => {
        // El género es información privada: avatar neutro
        const avatarIcon = 'fa-user-tie';
        
        const imagenHTML = docente.foto_url 
            ? `<img src="${docente.foto_url}" alt="${docente.nombre}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;margin-bottom:1rem;border:3px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.1);">`
            : `<div class="avatar"><i class="fa-solid ${avatarIcon}"></i></div>`;

        const card = document.createElement('div');
        card.className = 'teacher-card teacher-card-simple';
        card.innerHTML = `
            <div class="card-header">
                ${imagenHTML}
                <h3>${docente.nombre}</h3>
                ${docente.area_nombre ? `<span class="badge-area">${docente.area_nombre}</span>` : ''}
                ${docente.sede_nombre ? `<span class="badge-sede"><i class="fas fa-map-marker-alt"></i> ${docente.sede_nombre}</span>` : ''}
            </div>
        `;
        
        // Al hacer clic, redirigir al perfil del docente
        card.addEventListener('click', () => {
            window.location.href = `/docente/${docente.id}`;
        });
        
        container.appendChild(card);
    });
}

// ============================================
// LIMPIAR FILTROS
// ============================================
function limpiarFiltros() {
    searchName.value = '';
    filterArea.value = 'todos';
    filterSede.value = 'todos';
    filterLevel.value = 'todos';
    filterGender.value = 'todos';
    
    // También limpiar el buscador de la página de inicio
    if (heroSearchInput) {
        heroSearchInput.value = '';
    }
    
    fetchDocentes();
}

// ============================================
// VER HORARIO DEL DOCENTE (Modal)
// ============================================
function verHorario(docenteId) {
    window.open(`/docente/${docenteId}`, '_blank');
}

// ============================================
// LÓGICA DE BÚSQUEDA DESDE EL HERO (INICIO)
// ============================================
function ejecutarBusquedaDesdeHero() {
    const texto = heroSearchInput.value.trim();
    // Pasar el texto al input de búsqueda de docentes
    searchName.value = texto;
    // Cambiar a pestaña Docentes
    switchTab('docentes');
    // Ejecutar filtro
    fetchDocentes();
}

if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', ejecutarBusquedaDesdeHero);
}

if (heroSearchInput) {
    heroSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            ejecutarBusquedaDesdeHero();
        }
    });
}

// ============================================
// EVENTOS DE FILTRO
// ============================================
// Debounce: evita disparar una petición por cada tecla escrita
function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

searchName.addEventListener('input', debounce(fetchDocentes));
filterArea.addEventListener('change', fetchDocentes);
filterSede.addEventListener('change', fetchDocentes);
filterLevel.addEventListener('change', fetchDocentes);
filterGender.addEventListener('change', fetchDocentes);

// ============================================
// BOTÓN LIMPIAR FILTROS (compatible con CSP)
// ============================================
document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);

// Event delegation para el botón de limpiar en "No hay resultados"
document.getElementById('teachers-container').addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-limpiar-noresults');
    if (btn) {
        limpiarFiltros();
    }
});

// ============================================
// INICIALIZAR — Leer hash de la URL
// ============================================

// Enlace del footer "Áreas Académicas" → sección Docentes con el
// filtro de "Área Académica" activo y listo para que el usuario elija un área.
function enfocarFiltroArea() {
    const filtroArea = document.getElementById('filter-area');
    if (!filtroArea) return;

    // Espera a que termine el scroll suave de switchTab para
    // centrar la vista en los filtros y dejar el campo listo para usar.
    setTimeout(() => {
        filtroArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        filtroArea.focus({ preventScroll: true });
    }, 350);
}

function initFromHash() {
    const hash = window.location.hash.replace('#tab-', '');
    if (hash === 'docentes-area') {
        switchTab('docentes');
        enfocarFiltroArea();
        return;
    }
    if (hash === 'docentes' || hash === 'inicio') {
        switchTab(hash);
    }
}

// Escuchar cambios de hash (para enlaces desde el footer sin recargar)
window.addEventListener('hashchange', initFromHash);

// ============================================
// INICIALIZAR
// ============================================
initFromHash();
loadAreas();
fetchDocentes(true); // Pasar true para indicar carga inicial y poblar contadores