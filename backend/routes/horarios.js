const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifyToken = require('../middleware/auth');

// ============================================
// 📋 OBTENER PERIODOS ACADÉMICOS
// ============================================
router.get('/periodos', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM periodos_academicos ORDER BY fecha_inicio DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener periodos:', error);
        res.status(500).json({ error: 'Error al obtener periodos' });
    }
});

// ============================================
// 📋 OBTENER AÑOS ESCOLARES
// ============================================
router.get('/anos', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM anos_escolares ORDER BY nombre DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('❌ Error al obtener años escolares:', error);
        res.status(500).json({ error: 'Error al obtener años escolares' });
    }
});

// ============================================
// 📋 OBTENER HORARIO DE UN DOCENTE POR AÑO
// ============================================
router.get('/docente/:docenteId', async (req, res) => {
    try {
        const { docenteId } = req.params;
        const { ano_id } = req.query;
        
        let sql = `
            SELECT h.*, 
                   m.nombre as materia_nombre,
                   a.nombre as ano_nombre,
                   d.nombre as docente_nombre
            FROM horarios h
            LEFT JOIN materias m ON h.materia_id = m.id
            JOIN docentes d ON h.docente_id = d.id
            JOIN anos_escolares a ON h.ano_id = a.id
            WHERE h.docente_id = ?
        `;
        const params = [docenteId];
        
        if (ano_id) {
            sql += ` AND h.ano_id = ?`;
            params.push(ano_id);
        }
        
        sql += ` ORDER BY h.dia_semana, h.bloque`;
        
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener horario:', error);
        res.status(500).json({ error: 'Error al obtener horario' });
    }
});


// ============================================
// 📝 CREAR HORARIO
// ============================================
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            docente_id,
            ano_id,  // antes periodo_id
            dia_semana,
            bloque,
            materia_id,
            curso,
            salon
        } = req.body;
        
        // Validar campos obligatorios
        if (!docente_id || !ano_id || !dia_semana || !bloque) {
            return res.status(400).json({ 
                error: 'Docente, año, día y bloque son requeridos' 
            });
        }

        // Validar bloque (1-6)
        if (bloque < 1 || bloque > 6) {
            return res.status(400).json({ 
                error: 'El bloque debe ser entre 1 y 6' 
            });
        }

        // Verificar si el docente existe
        const [docente] = await pool.query('SELECT id FROM docentes WHERE id = ?', [docente_id]);
        if (docente.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        // Verificar si el año existe
        const [ano] = await pool.query('SELECT id FROM anos_escolares WHERE id = ?', [ano_id]);
        if (ano.length === 0) {
            return res.status(404).json({ error: 'Año escolar no encontrado' });
        }

        // Verificar si ya existe un horario en ese bloque
        const [existe] = await pool.query(
            `SELECT id FROM horarios 
             WHERE docente_id = ? AND ano_id = ? 
             AND dia_semana = ? AND bloque = ?`,
            [docente_id, ano_id, dia_semana, bloque]
        );
        
        if (existe.length > 0) {
            return res.status(400).json({ 
                error: `⚠️ Ya existe un horario en el bloque ${bloque} para ${dia_semana}` 
            });
        }

        // Si es clase, validar que tenga materia
        if (!materia_id) {
            return res.status(400).json({ 
                error: 'Debes seleccionar una materia para la clase' 
            });
        }

        // Verificar que la materia existe
        const [materia] = await pool.query('SELECT id FROM materias WHERE id = ?', [materia_id]);
        if (materia.length === 0) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }

        // Insertar horario
        const [result] = await pool.query(`
            INSERT INTO horarios (
                docente_id, ano_id, dia_semana, bloque,
                materia_id, curso, salon
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            docente_id, ano_id, dia_semana, bloque,
            materia_id, curso || null, salon || null
        ]);

        // Obtener el horario creado
        const [nuevoHorario] = await pool.query(`
            SELECT h.*, m.nombre as materia_nombre
            FROM horarios h
            LEFT JOIN materias m ON h.materia_id = m.id
            WHERE h.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: '✅ Horario creado exitosamente',
            horario: nuevoHorario[0]
        });
    } catch (error) {
        console.error('Error al crear horario:', error);
        res.status(500).json({ error: 'Error al crear horario' });
    }
});

// ============================================
// ✏️ ACTUALIZAR HORARIO
// ============================================
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dia_semana,
            bloque,
            materia_id,
            curso,
            salon
        } = req.body;

        // Verificar que existe
        const [existe] = await pool.query(
            'SELECT docente_id, ano_id FROM horarios WHERE id = ?',
            [id]
        );
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Horario no encontrado' });
        }

        // Verificar conflictos (excluyendo el mismo registro)
        const [conflictos] = await pool.query(`
            SELECT id FROM horarios 
            WHERE docente_id = ? AND ano_id = ?
            AND dia_semana = ? AND bloque = ?
            AND id != ?
        `, [existe[0].docente_id, existe[0].ano_id, dia_semana, bloque, id]);
        
        if (conflictos.length > 0) {
            return res.status(400).json({ 
                error: `⚠️ Ya existe un horario en el bloque ${bloque} para ${dia_semana}` 
            });
        }

        await pool.query(`
            UPDATE horarios SET
                dia_semana = ?,
                bloque = ?,
                materia_id = ?,
                curso = ?,
                salon = ?
            WHERE id = ?
        `, [dia_semana, bloque, materia_id || null, curso || null, salon || null, id]);

        res.json({ message: '✅ Horario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        res.status(500).json({ error: 'Error al actualizar horario' });
    }
});

// ============================================
// 🗑️ ELIMINAR HORARIO
// ============================================
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que existe
        const [existe] = await pool.query('SELECT id FROM horarios WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Horario no encontrado' });
        }
        
        await pool.query('DELETE FROM horarios WHERE id = ?', [id]);
        
        res.json({ message: '✅ Horario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar horario:', error);
        res.status(500).json({ error: 'Error al eliminar horario' });
    }
});

// ============================================
// 📊 OBTENER HORARIO COMPLETO POR AÑO
// ============================================
router.get('/ano/:anoId', async (req, res) => {
    try {
        const { anoId } = req.params;
        
        const [rows] = await pool.query(`
            SELECT h.*, 
                   m.nombre as materia_nombre,
                   d.nombre as docente_nombre
            FROM horarios h
            LEFT JOIN materias m ON h.materia_id = m.id
            JOIN docentes d ON h.docente_id = d.id
            WHERE h.ano_id = ?
            ORDER BY h.dia_semana, h.bloque
        `, [anoId]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener horarios del año:', error);
        res.status(500).json({ error: 'Error al obtener horarios del año' });
    }
});

module.exports = router;