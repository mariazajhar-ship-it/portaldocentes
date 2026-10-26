// ============================================
// portal-dashboard.js — Dashboard y gráficas
// ============================================

// Variables para las gráficas
let chartArea = null;
let chartGenero = null;
let chartSede = null;

// ============================================
// CARGAR DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${window.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        const tab = document.querySelector('#tab-dashboard');
        if (tab) {
            tab.innerHTML = `
                <div style="text-align:center;padding:3rem;color:var(--text-muted);">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--danger-color);"></i>
                    <p>Error al cargar el dashboard. Por favor, recarga la página.</p>
                </div>
            `;
        }
    }
}

// ============================================
// RENDERIZAR DASHBOARD
// ============================================
function renderDashboard(data) {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || 0;
    };

    setText('totalDocentes', data.totales?.total_docentes);
    setText('totalAreas', data.totales?.total_areas);
    setText('totalMaterias', data.totales?.total_materias);
    setText('totalGenero', data.totales?.total_docentes);
    setText('totalSedes', data.totales?.total_sedes);

    const generoDet = document.getElementById('generoDetalle');
    if (generoDet) {
        generoDet.textContent = `Hombres: ${data.totales?.hombres || 0} · Mujeres: ${data.totales?.mujeres || 0}`;
    }

    renderChartArea(data.porArea);
    renderChartGenero(data.porGenero);
    renderChartSede(data.porSede);
    renderUltimosDocentes(data.ultimosDocentes);
    renderEstado(data.estado);
    renderNombramiento(data.porNombramiento);
}

// ============================================
// GRÁFICA 1: DOCENTES POR ÁREA (Barras)
// ============================================
function renderChartArea(data) {
    const ctx = document.getElementById('chartArea');
    if (!ctx || !data) return;

    if (chartArea) chartArea.destroy();

    const labels = data.map(item => item.area);
    const values = data.map(item => item.cantidad);
    const colors = ['#2e7d32', '#1565c0', '#e65100', '#c62828', '#6a1b9a', '#00838f', '#4e342e', '#f9a825'];

    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js no está disponible. Verifica la conexión CDN.');
        ctx.parentElement.innerHTML = '<p style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-chart-simple"></i> Gráfica no disponible (Chart.js no cargó)</p>';
        return;
    }

    try {
        chartArea = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Docentes por Área',
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: colors.slice(0, labels.length).map(c => c + 'cc'),
                    borderWidth: 1,
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    } catch (e) {
        console.error('❌ Error al renderizar gráfica de áreas:', e);
    }
}

// ============================================
// GRÁFICA 2: DISTRIBUCIÓN POR GÉNERO (Dona)
// ============================================
function renderChartGenero(data) {
    const ctx = document.getElementById('chartGenero');
    if (!ctx || !data) return;

    if (chartGenero) chartGenero.destroy();

    const labels = data.map(item => item.genero || 'No especificado');
    const values = data.map(item => item.cantidad);
    const colors = ['#1976d2', '#c62828', '#6a1b9a'];

    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js no está disponible. Verifica la conexión CDN.');
        ctx.parentElement.innerHTML = '<p style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-chart-pie"></i> Gráfica no disponible (Chart.js no cargó)</p>';
        return;
    }

    try {
        chartGenero = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } },
                cutout: '65%'
            }
        });
    } catch (e) {
        console.error('❌ Error al renderizar gráfica de género:', e);
    }
}

// ============================================
// ÚLTIMOS DOCENTES
// ============================================
function renderUltimosDocentes(docentes) {
    const container = document.getElementById('ultimosDocentes');
    if (!container) return;

    if (!docentes || docentes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No hay docentes registrados</p>';
        return;
    }

    container.innerHTML = docentes.map(d => {
        const fecha = new Date(d.created_at);
        const fechaStr = fecha.toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return `
            <div class="recent-item">
                <div>
                    <span class="nombre">${d.nombre}</span>
                    <span class="area">${d.area}</span>
                </div>
                <span class="fecha">${fechaStr}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// ESTADO DE DOCENTES
// ============================================
function renderEstado(data) {
    const container = document.getElementById('estadoDocentes');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">Sin datos</p>';
        return;
    }

    container.innerHTML = data.map(item => {
        const isActivo = item.estado === 'Activo';
        return `
            <div class="status-item">
                <span class="label ${isActivo ? 'badge-activo' : 'badge-inactivo'}">
                    <i class="fas fa-${isActivo ? 'check-circle' : 'times-circle'}"></i>
                    ${item.estado}
                </span>
                <span class="count">${item.cantidad}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// GRÁFICA 4: DOCENTES POR SEDE (Barras)
// ============================================
function renderChartSede(data) {
    const ctx = document.getElementById('chartSede');
    if (!ctx || !data) return;

    if (chartSede) chartSede.destroy();

    const labels = data.map(item => item.sede);
    const values = data.map(item => item.cantidad);
    const colors = ['#2e7d32', '#1565c0', '#e65100', '#c62828', '#6a1b9a', '#00838f', '#f9a825', '#4e342e'];

    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js no está disponible. Verifica la conexión CDN.');
        ctx.parentElement.innerHTML = '<p style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-chart-simple"></i> Gráfica no disponible</p>';
        return;
    }

    try {
        chartSede = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Docentes por Sede',
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: colors.slice(0, labels.length).map(c => c + 'cc'),
                    borderWidth: 1,
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    } catch (e) {
        console.error('❌ Error al renderizar gráfica de sedes:', e);
    }
}

// ============================================
// TIPO DE NOMBRAMIENTO
// ============================================
function renderNombramiento(data) {
    const container = document.getElementById('nombramientoDocentes');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">Sin datos</p>';
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="status-item">
            <span class="label">${item.tipo_nombramiento}</span>
            <span class="count">${item.cantidad}</span>
        </div>
    `).join('');
}
