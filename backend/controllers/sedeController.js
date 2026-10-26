const pool = require('../config/database');

// ============================================
// OBTENER TODAS LAS SEDES
// ============================================
const getSedes = async (req, res) => {
    try {
        let sql = 'SELECT * FROM sedes ORDER BY nombre';
        const queryParams = [];

        // Si viene el parámetro activos, filtrar
        if (req.query.activos === 'true') {
            sql = 'SELECT * FROM sedes WHERE activo = 1 ORDER BY nombre';
        }

        const [rows] = await pool.query(sql, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener sedes:', error);
        res.status(500).json({ error: 'Error al obtener sedes' });
    }
};

// ============================================
// OBTENER SEDE POR ID
// ============================================
const getSedeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM sedes WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Sede no encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener sede:', error);
        res.status(500).json({ error: 'Error al obtener sede' });
    }
};

// ============================================
// CREAR NUEVA SEDE
// ============================================
const createSede = async (req, res) => {
    try {
        const { nombre, direccion, descripcion, activo } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la sede es obligatorio' });
        }

        const [result] = await pool.query(`
            INSERT INTO sedes (nombre, direccion, descripcion, activo)
            VALUES (?, ?, ?, ?)
        `, [nombre.trim(), direccion || null, descripcion || null, activo !== undefined ? activo : 1]);

        const [nuevaSede] = await pool.query('SELECT * FROM sedes WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Sede creada exitosamente',
            sede: nuevaSede[0]
        });
    } catch (error) {
        console.error('Error al crear sede:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe una sede con este nombre' });
        }
        res.status(500).json({ error: 'Error al crear sede' });
    }
};

// ============================================
// ACTUALIZAR SEDE
// ============================================
const updateSede = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, direccion, descripcion, activo } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la sede es obligatorio' });
        }

        const [result] = await pool.query(`
            UPDATE sedes SET nombre = ?, direccion = ?, descripcion = ?, activo = ?
            WHERE id = ?
        `, [nombre.trim(), direccion || null, descripcion || null, activo !== undefined ? activo : 1, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sede no encontrada' });
        }

        const [sedeActualizada] = await pool.query('SELECT * FROM sedes WHERE id = ?', [id]);

        res.json({
            message: 'Sede actualizada exitosamente',
            sede: sedeActualizada[0]
        });
    } catch (error) {
        console.error('Error al actualizar sede:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe otra sede con este nombre' });
        }
        res.status(500).json({ error: 'Error al actualizar sede' });
    }
};

// ============================================
// ELIMINAR SEDE (desactivar en lugar de borrar)
// ============================================
const deleteSede = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay docentes asociados
        const [docentesAsociados] = await pool.query(
            'SELECT COUNT(*) as count FROM docentes WHERE sede_id = ?',
            [id]
        );

        if (docentesAsociados[0].count > 0) {
            // Desactivar en lugar de eliminar
            await pool.query('UPDATE sedes SET activo = 0 WHERE id = ?', [id]);
            return res.json({
                message: 'Sede desactivada. Hay docentes asociados a esta sede.',
                desactivada: true
            });
        }

        await pool.query('DELETE FROM sedes WHERE id = ?', [id]);
        res.json({ message: 'Sede eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar sede:', error);
        res.status(500).json({ error: 'Error al eliminar sede' });
    }
};

module.exports = {
    getSedes,
    getSedeById,
    createSede,
    updateSede,
    deleteSede
};
