const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifyToken = require('../middleware/auth');

// Obtener estadísticas del dashboard (SOLO ADMIN)
router.get('/stats', verifyToken, async (req, res) => {
    try {
        // 1. Totales generales
        const [totales] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM docentes) as total_docentes,
                (SELECT COUNT(*) FROM areas) as total_areas,
                (SELECT COUNT(*) FROM materias) as total_materias,
                (SELECT COUNT(*) FROM docentes WHERE genero = 'Femenino') as mujeres,
                (SELECT COUNT(*) FROM docentes WHERE genero = 'Masculino') as hombres
        `);

        // 2. Docentes por área
        const [porArea] = await pool.query(`
            SELECT 
                a.nombre as area,
                a.icono,
                COUNT(d.id) as cantidad
            FROM areas a
            LEFT JOIN docentes d ON a.id = d.area_id
            GROUP BY a.id
            ORDER BY cantidad DESC
        `);

        // 3. Docentes por género
        const [porGenero] = await pool.query(`
            SELECT 
                genero,
                COUNT(*) as cantidad
            FROM docentes
            WHERE genero IS NOT NULL
            GROUP BY genero
        `);

        // 4. Últimos docentes agregados
        const [ultimosDocentes] = await pool.query(`
            SELECT 
                d.id,
                d.nombre,
                d.cedula,
                a.nombre as area,
                d.created_at
            FROM docentes d
            JOIN areas a ON d.area_id = a.id
            ORDER BY d.created_at DESC
            LIMIT 5
        `);

        // 5. Docentes por nivel académico
        const [porNivel] = await pool.query(`
            SELECT 
                CASE 
                    WHEN formacion LIKE '%Licenciado%' THEN 'Licenciatura'
                    WHEN formacion LIKE '%Especialista%' THEN 'Especialización'
                    WHEN formacion LIKE '%Magíster%' OR formacion LIKE '%Maestría%' THEN 'Maestría'
                    WHEN formacion LIKE '%Doctor%' THEN 'Doctorado'
                    ELSE 'Otro'
                END as nivel,
                COUNT(*) as cantidad
            FROM docentes
            GROUP BY nivel
            ORDER BY cantidad DESC
        `);

        // 6. Docentes activos vs inactivos
        const [estado] = await pool.query(`
            SELECT 
                CASE 
                    WHEN JSON_EXTRACT(visibilidad, '$.activo') = true THEN 'Activo'
                    ELSE 'Inactivo'
                END as estado,
                COUNT(*) as cantidad
            FROM docentes
            GROUP BY estado
        `);

        // 7. Docentes por tipo de nombramiento
        const [porNombramiento] = await pool.query(`
            SELECT 
                tipo_nombramiento,
                COUNT(*) as cantidad
            FROM docentes
            GROUP BY tipo_nombramiento
            ORDER BY cantidad DESC
        `);

        // 8. Docentes por sede
        const [porSede] = await pool.query(`
            SELECT 
                COALESCE(s.nombre, 'Sin sede') as sede,
                s.id as sede_id,
                COUNT(d.id) as cantidad
            FROM docentes d
            LEFT JOIN sedes s ON d.sede_id = s.id
            GROUP BY s.id, s.nombre
            ORDER BY cantidad DESC
        `);

        // 9. Total de sedes activas
        const [totalSedes] = await pool.query(`
            SELECT COUNT(*) as total FROM sedes WHERE activo = 1
        `);

        res.json({
            totales: {
                ...totales[0],
                total_sedes: totalSedes[0].total
            },
            porArea,
            porGenero,
            ultimosDocentes,
            porNivel,
            estado,
            porNombramiento,
            porSede
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;