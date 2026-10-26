const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Buscar usuario
        const [users] = await pool.query(
            'SELECT * FROM usuarios_admin WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = users[0];
        
        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Actualizar último login
        await pool.query(
            'UPDATE usuarios_admin SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generar token
        const token = jwt.sign(
            { id: user.id, username: user.username, nombre: user.nombre_completo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre_completo,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

const verify = async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar token' });
    }
};

// Cambiar contraseña (ADMIN autenticado)
const changePassword = async (req, res) => {
    try {
        const { password_actual, password_nueva } = req.body;

        if (typeof password_actual !== 'string' || typeof password_nueva !== 'string' || !password_actual || !password_nueva) {
            return res.status(400).json({ error: 'Debes ingresar la contraseña actual y la nueva' });
        }

        if (password_nueva.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        if (password_nueva === password_actual) {
            return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
        }

        // Obtener el usuario actual
        const [users] = await pool.query(
            'SELECT * FROM usuarios_admin WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar la contraseña actual
        const validPassword = await bcrypt.compare(password_actual, users[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        // Actualizar la contraseña
        const newHash = await bcrypt.hash(password_nueva, 12);
        await pool.query(
            'UPDATE usuarios_admin SET password_hash = ? WHERE id = ?',
            [newHash, req.user.id]
        );

        res.json({ message: '✅ Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
};

module.exports = { login, verify, changePassword };