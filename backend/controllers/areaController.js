const pool = require('../config/database');

const getAreas = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM areas ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ error: 'Error al obtener áreas' });
    }
};

const getAreaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM areas WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener área:', error);
        res.status(500).json({ error: 'Error al obtener área' });
    }
};

const createArea = async (req, res) => {
    try {
        const { id, nombre, icono, descripcion, popular } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO areas (id, nombre, icono, descripcion, popular)
            VALUES (?, ?, ?, ?, ?)
        `, [id, nombre, icono, descripcion, popular || false]);

        res.status(201).json({ 
            message: 'Área creada exitosamente',
            id: id
        });
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({ error: 'Error al crear área' });
    }
};

const updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, icono, descripcion, popular } = req.body;

        const [result] = await pool.query(`
            UPDATE areas SET nombre = ?, icono = ?, descripcion = ?, popular = ?
            WHERE id = ?
        `, [nombre, icono, descripcion, popular, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }

        res.json({ message: 'Área actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({ error: 'Error al actualizar área' });
    }
};

const deleteArea = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM areas WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }

        res.json({ message: 'Área eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({ error: 'Error al eliminar área' });
    }
};

module.exports = {
    getAreas,
    getAreaById,
    createArea,
    updateArea,
    deleteArea
};