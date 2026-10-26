const pool = require('../config/database');

// ============================================
// 📞 INFORMACIÓN DE CONTACTO DEL PORTAL PÚBLICO
// ============================================
// Tabla `informacion_contacto` (fila única, id = 1).
// GET  -> público (lo muestra index.html / docente.html)
// PUT  -> solo administrador (Panel Administrativo > pestaña Contacto)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGITUDES = { email: 150, telefono: 50, direccion: 255, ciudad: 100, departamento: 100, pais: 100 };

const CONTACTO_DEFECTO = {
    id: 1,
    email: null,
    telefono: null,
    direccion: null,
    ciudad: null,
    departamento: null,
    pais: null
};

const getContacto = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM informacion_contacto ORDER BY id ASC LIMIT 1'
        );

        if (rows.length === 0) {
            return res.json(CONTACTO_DEFECTO);
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener información de contacto:', error);
        res.status(500).json({ error: 'Error al obtener la información de contacto' });
    }
};

const updateContacto = async (req, res) => {
    try {
        const campos = ['email', 'telefono', 'direccion', 'ciudad', 'departamento', 'pais'];
        const datos = {};

        for (const campo of campos) {
            const valor = req.body[campo];
            if (valor !== undefined && valor !== null && typeof valor !== 'string') {
                return res.status(400).json({ error: `El campo "${campo}" no es válido` });
            }
            const limpio = valor ? String(valor).trim() : '';
            if (limpio.length > LONGITUDES[campo]) {
                return res.status(400).json({
                    error: `El campo "${campo}" no debe superar los ${LONGITUDES[campo]} caracteres`
                });
            }
            datos[campo] = limpio || null;
        }

        if (datos.email && !EMAIL_RE.test(datos.email)) {
            return res.status(400).json({ error: 'El correo electrónico no es válido' });
        }

        // Upsert de la fila única (id = 1)
        const [existe] = await pool.query(
            'SELECT id FROM informacion_contacto WHERE id = 1'
        );

        if (existe.length === 0) {
            await pool.query(
                `INSERT INTO informacion_contacto
                    (id, email, telefono, direccion, ciudad, departamento, pais)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [1, datos.email, datos.telefono, datos.direccion, datos.ciudad, datos.departamento, datos.pais]
            );
        } else {
            await pool.query(
                `UPDATE informacion_contacto SET
                    email = ?, telefono = ?, direccion = ?, ciudad = ?, departamento = ?, pais = ?
                 WHERE id = 1`,
                [datos.email, datos.telefono, datos.direccion, datos.ciudad, datos.departamento, datos.pais]
            );
        }

        const [actualizada] = await pool.query(
            'SELECT * FROM informacion_contacto WHERE id = 1'
        );

        res.json({
            message: '✅ Información de contacto actualizada exitosamente',
            contacto: actualizada[0]
        });
    } catch (error) {
        console.error('Error al actualizar información de contacto:', error);
        res.status(500).json({ error: 'Error al guardar la información de contacto' });
    }
};

module.exports = { getContacto, updateContacto };
