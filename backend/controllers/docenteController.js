const pool = require('../config/database');

// ============================================
// 🛡️ HELPERS DE VALIDACIÓN
// ============================================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CEDULA_RE = /^\d{6,12}$/;
const TELEFONO_RE = /^[\d\s+\-()]{7,15}$/;

const validarDatosDocente = (data) => {
    const { nombre, cedula, cargo, area_id, genero, email, telefono, formacion, grado_escalafon, horario_atencion, sobre_mi } = data;

    if (nombre && typeof nombre === 'string' && nombre.trim().length > 200) {
        return 'El nombre no debe superar los 200 caracteres';
    }
    if (cedula && !CEDULA_RE.test(String(cedula).trim())) {
        return 'La cédula debe contener solo números (6 a 12 dígitos)';
    }
    if (cargo && typeof cargo === 'string' && cargo.trim().length > 100) {
        return 'El cargo no debe superar los 100 caracteres';
    }
    if (area_id && typeof area_id !== 'string') {
        return 'Área no válida';
    }
    if (email && !EMAIL_RE.test(String(email))) {
        return 'El correo electrónico no es válido';
    }
    if (telefono && !TELEFONO_RE.test(String(telefono))) {
        return 'El teléfono no es válido';
    }
    if (formacion && typeof formacion === 'string' && formacion.length > 200) {
        return 'La formación no debe superar los 200 caracteres';
    }
    if (grado_escalafon && typeof grado_escalafon === 'string' && grado_escalafon.length > 100) {
        return 'El grado de escalafón no debe superar los 100 caracteres';
    }
    if (horario_atencion && typeof horario_atencion === 'string' && horario_atencion.length > 200) {
        return 'El horario de atención no debe superar los 200 caracteres';
    }
    if (sobre_mi && typeof sobre_mi === 'string' && sobre_mi.length > 5000) {
        return 'La descripción no debe superar los 5000 caracteres';
    }
    return null;
};

const validarSede = async (sede_id) => {
    if (!sede_id) return true;
    const [sedes] = await pool.query('SELECT id FROM sedes WHERE id = ?', [sede_id]);
    return sedes.length > 0;
};

// ============================================
// 🎓 FILTRO POR NIVEL ACADÉMICO
// ============================================
// El nivel puede estar en `formacion` (texto libre, ej: "Licenciado en...") o en
// `nivel_academico` (campo estructurado, ej: "Doctorado"). Se consultan ambos.
// La colación utf8mb4_0900_ai_ci ignora acentos y mayúsculas, por lo que los
// patrones en minúsculas sin acentos funcionan igual.
const PATRONES_NIVEL = {
    'licenciado':   ['licenciado', 'profesional', 'pregrado'],
    'especialista': ['especialista', 'especializacion'],
    'magister':     ['magister', 'maestria'],
    'doctor':       ['doctor']
};

const normalizarTexto = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const aplicarFiltroNivel = (sql, queryParams, nivel) => {
    const patrones = PATRONES_NIVEL[normalizarTexto(nivel)];
    if (!patrones) return sql;

    const condiciones = patrones.map(() => '(d.formacion LIKE ? OR d.nivel_academico LIKE ?)').join(' OR ');
    sql += ` AND (${condiciones})`;
    patrones.forEach(p => queryParams.push(`%${p}%`, `%${p}%`));
    return sql;
};

// ============================================
// 🔒 VISIBILIDAD PÚBLICA CAMPO A CAMPO
// ============================================
// Campos con candado: el administrador decide en el formulario si se muestran
// en el portal público. visibilidad.campos[campo] === true → candado abierto
// → visible; === false → candado cerrado → oculto.
const CAMPOS_CON_CANDADO = ['nivel_academico', 'horario_atencion', 'email', 'telefono', 'formacion', 'area'];

// Campos siempre privados: solo existen en el panel administrativo.
const CAMPOS_SIEMPRE_PRIVADOS = ['cedula', 'cargo', 'genero', 'fecha_nacimiento', 'tipo_nombramiento', 'grado_escalafon', 'visibilidad'];

// Estructura estable: { activo: bool, campos: { ... } }.
// Sin configuración previa todo queda visible (comportamiento histórico).
const normalizarVisibilidad = (visibilidad) => {
    const original = (visibilidad && typeof visibilidad === 'object') ? visibilidad : {};
    const campos = (original.campos && typeof original.campos === 'object') ? original.campos : {};
    const salida = { activo: original.activo !== false, campos: {} };

    CAMPOS_CON_CANDADO.forEach(campo => {
        salida.campos[campo] = campos[campo] !== false;
    });

    return salida;
};

// Elimina de la respuesta pública los campos privados y los cerrados con candado.
const aplicarVisibilidadPublica = (docente) => {
    const campos = (docente.visibilidad && docente.visibilidad.campos) || {};
    const salida = { ...docente };

    CAMPOS_CON_CANDADO.forEach(campo => {
        if (campos[campo] === false) {
            delete salida[campo];
            if (campo === 'area') {
                delete salida.area_id;
                delete salida.area_nombre;
            }
        }
    });

    CAMPOS_SIEMPRE_PRIVADOS.forEach(campo => delete salida[campo]);
    return salida;
};

// ============================================
// 🔓 RUTAS PÚBLICAS (index.html)
// ============================================

// Obtener docentes para vista pública (SIN CÉDULA)
const getDocentesPublicos = async (req, res) => {
    try {
        const { nombre, area, sede, nivel, genero } = req.query;

        let sql = `
            SELECT 
                d.id,
                d.nombre,
                d.area_id,
                d.sede_id,
                d.formacion,
                d.nivel_academico,
                d.horario_atencion,
                d.sobre_mi,
                d.email,
                d.telefono,
                d.foto_url,
                d.visibilidad,
                a.nombre AS area_nombre,
                s.nombre AS sede_nombre,
                GROUP_CONCAT(m.nombre SEPARATOR ', ') AS materias
            FROM docentes d
            JOIN areas a ON d.area_id = a.id
            LEFT JOIN sedes s ON d.sede_id = s.id
            LEFT JOIN docente_materias dm ON d.id = dm.docente_id
            LEFT JOIN materias m ON dm.materia_id = m.id
            WHERE 1=1
                AND JSON_EXTRACT(d.visibilidad, '$.activo') = true  -- Solo docentes activos
        `;
        const queryParams = [];

        if (nombre && nombre.trim() !== '') {
            // Búsqueda en nombre, formación, área y materias
            // (coherente con el placeholder "Buscar por nombre, materia o área...")
            // El texto de búsqueda se divide en palabras (nombres y apellidos) y
            // TODAS deben aparecer en el nombre del docente, sin importar el orden.
            // Así, "Carlos Trujillo Ortiz" también encuentra "Carlos Deyber Trujillo Ortiz".
            const palabras = nombre.trim().split(/\s+/).filter(Boolean);
            const condicionesNombre = palabras.map(() => 'd.nombre LIKE ?').join(' AND ');
            sql += ` AND (
                (${condicionesNombre})
                OR d.formacion LIKE ?
                OR a.nombre LIKE ?
                OR EXISTS (
                    SELECT 1 FROM docente_materias dm2
                    JOIN materias m2 ON dm2.materia_id = m2.id
                    WHERE dm2.docente_id = d.id AND m2.nombre LIKE ?
                )
            )`;
            // Parámetros: una marca por palabra (nombre) + la frase completa para
            // formación, área y materias — en el mismo orden de los placeholders.
            palabras.forEach(palabra => queryParams.push(`%${palabra}%`));
            const p = `%${nombre.trim()}%`;
            queryParams.push(p, p, p);
        }

        if (area && area !== 'todos') {
            sql += ` AND d.area_id = ?`;
            queryParams.push(area);
        }

        if (sede && sede !== 'todos') {
            sql += ` AND d.sede_id = ?`;
            queryParams.push(sede);
        }

        if (genero && genero !== 'todos') {
            sql += ` AND d.genero = ?`;
            queryParams.push(genero);
        }

        if (nivel && nivel !== 'todos') {
            sql = aplicarFiltroNivel(sql, queryParams, nivel);
        }

        sql += ` GROUP BY d.id ORDER BY d.nombre ASC`;

        const [rows] = await pool.query(sql, queryParams);
        
        // 🔥 IMPORTANTE: solo se publican los campos permitidos por el administrador
        const docentesPublicos = rows.map(aplicarVisibilidadPublica);
        
        res.json(docentesPublicos);
    } catch (error) {
        console.error('Error al obtener docentes públicos:', error);
        res.status(500).json({ error: 'Error al obtener docentes' });
    }
};

// ============================================
// 🔐 RUTAS PRIVADAS (portal.html)
// ============================================

// Obtener todos los docentes (ADMIN - CON CÉDULA)
const getDocentesAdmin = async (req, res) => {
    try {
        const { nombre, area, sede, nivel, genero, cedula } = req.query;

        let sql = `
            SELECT d.*, a.nombre AS area_nombre, s.nombre AS sede_nombre,
                   GROUP_CONCAT(m.nombre SEPARATOR ', ') AS materias
            FROM docentes d
            JOIN areas a ON d.area_id = a.id
            LEFT JOIN sedes s ON d.sede_id = s.id
            LEFT JOIN docente_materias dm ON d.id = dm.docente_id
            LEFT JOIN materias m ON dm.materia_id = m.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (nombre && nombre.trim() !== '') {
            sql += ` AND d.nombre LIKE ?`;
            queryParams.push(`%${nombre}%`);
        }

        // 🔥 Búsqueda por cédula SOLO para admin
        if (cedula && cedula.trim() !== '') {
            sql += ` AND d.cedula LIKE ?`;
            queryParams.push(`%${cedula}%`);
        }

        if (area && area !== 'todos') {
            sql += ` AND d.area_id = ?`;
            queryParams.push(area);
        }

        if (sede && sede !== 'todos') {
            sql += ` AND d.sede_id = ?`;
            queryParams.push(sede);
        }

        if (genero && genero !== 'todos') {
            sql += ` AND d.genero = ?`;
            queryParams.push(genero);
        }

        if (nivel && nivel !== 'todos') {
            sql = aplicarFiltroNivel(sql, queryParams, nivel);
        }

        sql += ` GROUP BY d.id ORDER BY d.nombre ASC`;

        const [rows] = await pool.query(sql, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener docentes admin:', error);
        res.status(500).json({ error: 'Error al obtener docentes' });
    }
};

// Obtener un docente público por ID (SIN CÉDULA) — perfil público
const getDocentePublicoById = async (req, res) => {
    try {
        const { id } = req.params;

        const [docentes] = await pool.query(`
            SELECT 
                d.id,
                d.nombre,
                d.area_id,
                d.sede_id,
                d.formacion,
                d.nivel_academico,
                d.horario_atencion,
                d.sobre_mi,
                d.email,
                d.telefono,
                d.foto_url,
                d.visibilidad,
                a.nombre AS area_nombre,
                s.nombre AS sede_nombre,
                GROUP_CONCAT(m.nombre SEPARATOR ', ') AS materias
            FROM docentes d
            JOIN areas a ON d.area_id = a.id
            LEFT JOIN sedes s ON d.sede_id = s.id
            LEFT JOIN docente_materias dm ON d.id = dm.docente_id
            LEFT JOIN materias m ON dm.materia_id = m.id
            WHERE d.id = ?
                AND JSON_EXTRACT(d.visibilidad, '$.activo') = true
            GROUP BY d.id
        `, [id]);

        if (docentes.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        res.json(aplicarVisibilidadPublica(docentes[0]));
    } catch (error) {
        console.error('Error al obtener docente público:', error);
        res.status(500).json({ error: 'Error al obtener docente' });
    }
};

// Obtener un docente por ID (ADMIN)
const getDocenteById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [docentes] = await pool.query(`
            SELECT d.*, a.nombre AS area_nombre, s.nombre AS sede_nombre,
                   DATE_FORMAT(d.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento
            FROM docentes d
            JOIN areas a ON d.area_id = a.id
            LEFT JOIN sedes s ON d.sede_id = s.id
            WHERE d.id = ?
        `, [id]);

        if (docentes.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        // Obtener materias del docente
        const [materias] = await pool.query(`
            SELECT m.* FROM materias m
            JOIN docente_materias dm ON m.id = dm.materia_id
            WHERE dm.docente_id = ?
        `, [id]);

        // Obtener horarios del docente
        const [horarios] = await pool.query(`
            SELECT h.*, m.nombre as materia_nombre, a.nombre as ano_nombre
            FROM horarios h
            LEFT JOIN materias m ON h.materia_id = m.id
            JOIN anos_escolares a ON h.ano_id = a.id
            WHERE h.docente_id = ?
            ORDER BY h.ano_id DESC, h.dia_semana, h.bloque
        `, [id]);

        res.json({
            ...docentes[0],
            materias,
            horarios
        });
    } catch (error) {
        console.error('Error al obtener docente:', error);
        res.status(500).json({ error: 'Error al obtener docente' });
    }
};

// Buscar docente por cédula (ADMIN)
const buscarPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;
        
        const [docentes] = await pool.query(`
            SELECT d.*, a.nombre AS area_nombre, s.nombre AS sede_nombre
            FROM docentes d
            JOIN areas a ON d.area_id = a.id
            LEFT JOIN sedes s ON d.sede_id = s.id
            WHERE d.cedula = ?
        `, [cedula]);

        if (docentes.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        res.json(docentes[0]);
    } catch (error) {
        console.error('Error al buscar por cédula:', error);
        res.status(500).json({ error: 'Error al buscar docente' });
    }
};

// Crear nuevo docente (ADMIN)
const createDocente = async (req, res) => {
    try {
        const {
            nombre, cedula, cargo, area_id, sede_id, formacion, nivel_academico,
            tipo_nombramiento, grado_escalafon, horario_atencion, sobre_mi,
            email, telefono, genero, fecha_nacimiento, visibilidad
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !cedula || !cargo || !area_id || !genero) {
            return res.status(400).json({ 
                error: 'Faltan campos obligatorios: nombre, cédula, cargo, área y género' 
            });
        }

        // Validar formato de los datos
        const errorValidacion = validarDatosDocente(req.body);
        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        // Validar que la cédula sea única
        const [existe] = await pool.query(
            'SELECT id FROM docentes WHERE cedula = ?',
            [cedula]
        );
        if (existe.length > 0) {
            return res.status(400).json({ 
                error: 'Ya existe un docente con esta cédula' 
            });
        }

        // Validar que el área existe
        const [areas] = await pool.query('SELECT id FROM areas WHERE id = ?', [area_id]);
        if (areas.length === 0) {
            return res.status(400).json({ error: 'Área no válida' });
        }

        // Validar que la sede existe (si se proporciona)
        if (!(await validarSede(sede_id))) {
            return res.status(400).json({ error: 'Sede no válida' });
        }

        // Validar fecha de nacimiento
        if (fecha_nacimiento) {
            const fecha = new Date(fecha_nacimiento);
            if (isNaN(fecha.getTime())) {
                return res.status(400).json({ error: 'Fecha de nacimiento no válida' });
            }
        }

        const [result] = await pool.query(`
            INSERT INTO docentes (
                nombre, cedula, cargo, area_id, sede_id, formacion, nivel_academico,
                tipo_nombramiento, grado_escalafon, horario_atencion, sobre_mi,
                email, telefono, genero, fecha_nacimiento, visibilidad
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre.trim(), cedula.trim(), cargo.trim(), area_id, sede_id || null, formacion, nivel_academico,
            tipo_nombramiento || 'Provisional', grado_escalafon || null, horario_atencion, sobre_mi,
            (email || '').trim() || null, (telefono || '').trim() || null, genero, fecha_nacimiento || null,
            JSON.stringify(visibilidad || { activo: true })
        ]);

        const [nuevoDocente] = await pool.query(
            'SELECT id, nombre, cedula FROM docentes WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            message: 'Docente creado exitosamente',
            docente: nuevoDocente[0]
        });
    } catch (error) {
        console.error('Error al crear docente:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La cédula ya está registrada' });
        }
        res.status(500).json({ error: 'Error al crear docente' });
    }
};

// Actualizar docente (ADMIN)
const updateDocente = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre, cedula, cargo, area_id, sede_id, formacion, nivel_academico,
            tipo_nombramiento, grado_escalafon, horario_atencion, sobre_mi,
            email, telefono, genero, fecha_nacimiento, visibilidad
        } = req.body;

        // Validar formato de los datos
        const errorValidacion = validarDatosDocente(req.body);
        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        // Validar que la cédula sea única (excepto el mismo docente)
        if (cedula) {
            const [existe] = await pool.query(
                'SELECT id FROM docentes WHERE cedula = ? AND id != ?',
                [cedula, id]
            );
            if (existe.length > 0) {
                return res.status(400).json({ 
                    error: 'Ya existe otro docente con esta cédula' 
                });
            }
        }

        // Validar que la sede existe (si se proporciona)
        if (!(await validarSede(sede_id))) {
            return res.status(400).json({ error: 'Sede no válida' });
        }

        // Validar fecha de nacimiento
        if (fecha_nacimiento) {
            const fecha = new Date(fecha_nacimiento);
            if (isNaN(fecha.getTime())) {
                return res.status(400).json({ error: 'Fecha de nacimiento no válida' });
            }
        }

        const [result] = await pool.query(`
            UPDATE docentes SET
                nombre = ?, cedula = ?, cargo = ?, area_id = ?, sede_id = ?,
                formacion = ?, nivel_academico = ?, tipo_nombramiento = ?, grado_escalafon = ?,
                horario_atencion = ?, sobre_mi = ?, email = ?, telefono = ?, genero = ?,
                fecha_nacimiento = ?, visibilidad = ?
            WHERE id = ?
        `, [
            nombre.trim(), cedula.trim(), cargo.trim(), area_id, sede_id || null, formacion, nivel_academico,
            tipo_nombramiento, grado_escalafon || null, horario_atencion, sobre_mi,
            (email || '').trim() || null, (telefono || '').trim() || null, genero, fecha_nacimiento || null,
            JSON.stringify(normalizarVisibilidad(visibilidad)),
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        const [docenteActualizado] = await pool.query(
            'SELECT id, nombre, cedula FROM docentes WHERE id = ?',
            [id]
        );

        res.json({ 
            message: 'Docente actualizado exitosamente',
            docente: docenteActualizado[0]
        });
    } catch (error) {
        console.error('Error al actualizar docente:', error);
        res.status(500).json({ error: 'Error al actualizar docente' });
    }
};

// Eliminar docente (ADMIN) — eliminación COMPLETA del sistema
// Borra el docente junto con toda su información relacionada (horarios,
// materias asignadas y foto) para que no vuelva a aparecer en ninguna otra
// sección del Portal: gestión, búsqueda pública, filtros, perfiles públicos,
// horarios y estadísticas/conteos.
const deleteDocente = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;

        conn = await pool.getConnection();
        const [docente] = await conn.query(
            'SELECT id, nombre, foto_url FROM docentes WHERE id = ?',
            [id]
        );
        if (docente.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }
        const nombre = docente[0].nombre;
        const fotoUrl = docente[0].foto_url;

        // Eliminar de forma atómica el docente y sus relaciones
        await conn.beginTransaction();
        try {
            // 1. Relaciones en otras tablas
            await conn.query('DELETE FROM horarios WHERE docente_id = ?', [id]);
            await conn.query('DELETE FROM docente_materias WHERE docente_id = ?', [id]);
            // 2. El docente
            await conn.query('DELETE FROM docentes WHERE id = ?', [id]);
            await conn.commit();
        } catch (txError) {
            await conn.rollback();
            throw txError;
        }

        // 3. Archivo de foto (fuera de la transacción)
        if (fotoUrl) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../public', fotoUrl);
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (fsError) {
                console.warn('No se pudo eliminar la foto del docente:', fsError.message);
            }
        }

        res.json({ 
            message: `Docente "${nombre}" eliminado correctamente` 
        });
    } catch (error) {
        console.error('Error al eliminar docente:', error);
        res.status(500).json({ error: 'Error al eliminar docente' });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar docente permanentemente (ADMIN)
const deleteDocentePermanente = async (req, res) => {
    try {
        const { id } = req.params;

        const [docente] = await pool.query(
            'SELECT id, nombre FROM docentes WHERE id = ?',
            [id]
        );
        if (docente.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        const [result] = await pool.query('DELETE FROM docentes WHERE id = ?', [id]);

        res.json({ 
            message: `Docente "${docente[0].nombre}" eliminado permanentemente` 
        });
    } catch (error) {
        console.error('Error al eliminar docente:', error);
        res.status(500).json({ error: 'Error al eliminar docente' });
    }
};

// Subir foto del docente (ADMIN)
const uploadFoto = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }

        const fotoUrl = `/profes/${req.file.filename}`;

        // Actualizar la columna foto_url en la base de datos
        const [result] = await pool.query(
            'UPDATE docentes SET foto_url = ? WHERE id = ?',
            [fotoUrl, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        res.json({
            message: 'Foto subida exitosamente',
            foto_url: fotoUrl
        });
    } catch (error) {
        console.error('Error al subir foto:', error);
        res.status(500).json({ error: 'Error al subir la foto del docente' });
    }
};

module.exports = {
    getDocentesPublicos,      // 🔓 Público
    getDocentePublicoById,    // 🔓 Público (perfil)
    getDocentesAdmin,         // 🔐 Admin
    getDocenteById,           // 🔐 Admin
    buscarPorCedula,          // 🔐 Admin
    createDocente,            // 🔐 Admin
    updateDocente,            // 🔐 Admin
    deleteDocente,            // 🔐 Admin (soft delete)
    deleteDocentePermanente,  // 🔐 Admin (hard delete)
    uploadFoto                // 🔐 Admin (foto)
};