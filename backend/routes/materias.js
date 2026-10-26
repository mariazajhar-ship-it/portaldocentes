const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifyToken = require('../middleware/auth');

// ============================================
// 📋 LISTAR TODAS LAS MATERIAS (Público)
// ============================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, a.nombre as area_nombre 
            FROM materias m
            LEFT JOIN areas a ON m.area_id = a.id
            ORDER BY m.nombre
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener materias:', error);
        res.status(500).json({ error: 'Error al obtener materias' });
    }
});

// ============================================
//🔍 OBTENER UNA MATERIA POR ID (Admin)
// ============================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT m.*, a.nombre as area_nombre 
            FROM materias m
            LEFT JOIN areas a ON m.area_id = a.id
            WHERE m.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener materia:', error);
        res.status(500).json({ error: 'Error al obtener materia' });
    }
});

// ============================================
//📝 CREAR NUEVA MATERIA (Solo Admin)
// ============================================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nombre, area_id } = req.body;
        
        // Validar campos obligatorios
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la materia es requerido' });
        }
        
        if (!area_id) {
            return res.status(400).json({ error: 'El área es requerida' });
        }

        // Verificar si el área existe
        const [areaExiste] = await pool.query('SELECT id FROM areas WHERE id = ?', [area_id]);
        if (areaExiste.length === 0) {
            return res.status(400).json({ error: 'El área seleccionada no existe' });
        }

        // Verificar si la materia ya existe (mismo nombre y área)
        const [existe] = await pool.query(
            'SELECT id FROM materias WHERE nombre = ? AND area_id = ?',
            [nombre.trim(), area_id]
        );
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Esta materia ya existe en el área seleccionada' });
        }

        const [result] = await pool.query(
            'INSERT INTO materias (nombre, area_id) VALUES (?, ?)',
            [nombre.trim(), area_id]
        );
        
        // Obtener la materia creada con el área
        const [nuevaMateria] = await pool.query(`
            SELECT m.*, a.nombre as area_nombre 
            FROM materias m
            LEFT JOIN areas a ON m.area_id = a.id
            WHERE m.id = ?
        `, [result.insertId]);
        
        res.status(201).json({ 
            message: '✅ Materia creada exitosamente',
            materia: nuevaMateria[0]
        });
    } catch (error) {
        console.error('Error al crear materia:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Esta materia ya existe' });
        }
        res.status(500).json({ error: 'Error al crear materia' });
    }
});

// ============================================
//✏️ ACTUALIZAR MATERIA (Solo Admin)
// ============================================
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, area_id } = req.body;
        
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la materia es requerido' });
        }
        
        if (!area_id) {
            return res.status(400).json({ error: 'El área es requerida' });
        }

        // Verificar si la materia existe
        const [existe] = await pool.query('SELECT id FROM materias WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }

        // Verificar si el área existe
        const [areaExiste] = await pool.query('SELECT id FROM areas WHERE id = ?', [area_id]);
        if (areaExiste.length === 0) {
            return res.status(400).json({ error: 'El área seleccionada no existe' });
        }

        // Verificar duplicado (mismo nombre y área, diferente ID)
        const [duplicado] = await pool.query(
            'SELECT id FROM materias WHERE nombre = ? AND area_id = ? AND id != ?',
            [nombre.trim(), area_id, id]
        );
        if (duplicado.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra materia con este nombre en el área seleccionada' });
        }

        await pool.query(
            'UPDATE materias SET nombre = ?, area_id = ? WHERE id = ?',
            [nombre.trim(), area_id, id]
        );
        
        // Obtener la materia actualizada
        const [materiaActualizada] = await pool.query(`
            SELECT m.*, a.nombre as area_nombre 
            FROM materias m
            LEFT JOIN areas a ON m.area_id = a.id
            WHERE m.id = ?
        `, [id]);
        
        res.json({ 
            message: '✅ Materia actualizada exitosamente',
            materia: materiaActualizada[0]
        });
    } catch (error) {
        console.error('Error al actualizar materia:', error);
        res.status(500).json({ error: 'Error al actualizar materia' });
    }
});

// ============================================
//🗑️ ELIMINAR MATERIA (Solo Admin)
// ============================================
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si existe
        const [existe] = await pool.query('SELECT id, nombre FROM materias WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }

        // Verificar si está siendo usada por algún docente
        const [usada] = await pool.query(
            'SELECT docente_id FROM docente_materias WHERE materia_id = ? LIMIT 1',
            [id]
        );
        if (usada.length > 0) {
            return res.status(400).json({ 
                error: '❌ No se puede eliminar esta materia porque está asignada a un docente' 
            });
        }

        // Verificar si está siendo usada en horarios
        const [enHorario] = await pool.query(
            'SELECT id FROM horarios WHERE materia_id = ? LIMIT 1',
            [id]
        );
        if (enHorario.length > 0) {
            return res.status(400).json({ 
                error: '❌ No se puede eliminar esta materia porque está asignada a un horario' 
            });
        }

        await pool.query('DELETE FROM materias WHERE id = ?', [id]);
        
        res.json({ 
            message: `✅ Materia "${existe[0].nombre}" eliminada exitosamente` 
        });
    } catch (error) {
        console.error('Error al eliminar materia:', error);
        res.status(500).json({ error: 'Error al eliminar materia' });
    }
});

// ============================================
//📊 OBTENER MATERIAS POR ÁREA
// ============================================
router.get('/area/:areaId', async (req, res) => {
    try {
        const { areaId } = req.params;
        
        const [rows] = await pool.query(`
            SELECT m.* FROM materias m
            WHERE m.area_id = ?
            ORDER BY m.nombre
        `, [areaId]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener materias por área:', error);
        res.status(500).json({ error: 'Error al obtener materias por área' });
    }
});

// ============================================
//📋 OBTENER MATERIAS DE UN DOCENTE
// ============================================
router.get('/docente/:docenteId', async (req, res) => {
    try {
        const { docenteId } = req.params;
        
        const [rows] = await pool.query(`
            SELECT m.*, a.nombre as area_nombre 
            FROM materias m
            JOIN docente_materias dm ON m.id = dm.materia_id
            LEFT JOIN areas a ON m.area_id = a.id
            WHERE dm.docente_id = ?
            ORDER BY m.nombre
        `, [docenteId]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener materias del docente:', error);
        res.status(500).json({ error: 'Error al obtener materias del docente' });
    }
});

// ============================================
//🔗 ASIGNAR MATERIA A DOCENTE (Admin)
// ============================================
router.post('/asignar', verifyToken, async (req, res) => {
    try {
        const { docente_id, materia_id } = req.body;
        
        if (!docente_id || !materia_id) {
            return res.status(400).json({ error: 'Docente y materia son requeridos' });
        }

        // Verificar si el docente existe
        const [docente] = await pool.query('SELECT id FROM docentes WHERE id = ?', [docente_id]);
        if (docente.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        // Verificar si la materia existe
        const [materia] = await pool.query('SELECT id FROM materias WHERE id = ?', [materia_id]);
        if (materia.length === 0) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }

        // Verificar si ya está asignada
        const [existe] = await pool.query(
            'SELECT * FROM docente_materias WHERE docente_id = ? AND materia_id = ?',
            [docente_id, materia_id]
        );
        
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Esta materia ya está asignada al docente' });
        }

        await pool.query(
            'INSERT INTO docente_materias (docente_id, materia_id) VALUES (?, ?)',
            [docente_id, materia_id]
        );
        
        res.json({ message: '✅ Materia asignada exitosamente' });
    } catch (error) {
        console.error('Error al asignar materia:', error);
        res.status(500).json({ error: 'Error al asignar materia' });
    }
});

// ============================================
//🔗 REMOVER MATERIA DE DOCENTE (Admin)
// ============================================
router.delete('/asignar/:docenteId/:materiaId', verifyToken, async (req, res) => {
    try {
        const { docenteId, materiaId } = req.params;
        
        const [existe] = await pool.query(
            'SELECT * FROM docente_materias WHERE docente_id = ? AND materia_id = ?',
            [docenteId, materiaId]
        );
        
        if (existe.length === 0) {
            return res.status(404).json({ error: 'La asignación no existe' });
        }
        
        await pool.query(
            'DELETE FROM docente_materias WHERE docente_id = ? AND materia_id = ?',
            [docenteId, materiaId]
        );
        
        res.json({ message: '✅ Materia removida exitosamente' });
    } catch (error) {
        console.error('Error al remover materia:', error);
        res.status(500).json({ error: 'Error al remover materia' });
    }
});

module.exports = router;