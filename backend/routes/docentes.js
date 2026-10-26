const express = require('express');
const router = express.Router();
const {
    getDocentesPublicos,      // 🔓 Público
    getDocentePublicoById,    // 🔓 Público (perfil)
    getDocentesAdmin,         // 🔐 Admin
    getDocenteById,           // 🔐 Admin
    buscarPorCedula,          // 🔐 Admin
    createDocente,            // 🔐 Admin
    updateDocente,            // 🔐 Admin
    deleteDocente,            // 🔐 Admin
    deleteDocentePermanente,  // 🔐 Admin
    uploadFoto                // 🔐 Admin (foto)
} = require('../controllers/docenteController');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');

// ============================================
// 🔓 RUTAS PÚBLICAS (index.html)
// ============================================
router.get('/publicos', getDocentesPublicos);        // Listado público (sin cédula)
router.get('/publicos/:id', getDocentePublicoById);  // Perfil público por ID (sin cédula)

// ============================================
// 🔐 RUTAS PRIVADAS (portal.html)
// ============================================
router.get('/', verifyToken, getDocentesAdmin);  // Admin con cédula
router.get('/cedula/:cedula', verifyToken, buscarPorCedula);  // Búsqueda por cédula (DEBE ir antes que /:id)
router.get('/:id', verifyToken, getDocenteById);

router.post('/', verifyToken, createDocente);
router.put('/:id', verifyToken, updateDocente);
router.delete('/:id', verifyToken, deleteDocente);
router.delete('/:id/permanente', verifyToken, deleteDocentePermanente);

// 📷 Subir foto del docente (con manejo de errores de multer)
router.post('/:id/foto', verifyToken, (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'La imagen no debe superar los 2 MB' });
            }
            return res.status(400).json({ error: err.message || 'Error al subir la imagen' });
        }
        next();
    });
}, uploadFoto);

// 🗑️ Eliminar foto del docente
router.delete('/:id/foto', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = require('../config/database');
        
        // Obtener la foto actual
        const [docentes] = await pool.query(
            'SELECT id, foto_url FROM docentes WHERE id = ?',
            [id]
        );
        
        if (docentes.length === 0) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }
        
        const fotoUrl = docentes[0].foto_url;
        
        // Eliminar el archivo físico si existe
        if (fotoUrl) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../public', fotoUrl);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fsError) {
                console.warn('No se pudo eliminar el archivo físico:', fsError.message);
            }
        }
        
        // Actualizar la BD
        await pool.query(
            'UPDATE docentes SET foto_url = NULL WHERE id = ?',
            [id]
        );
        
        res.json({ message: '✅ Foto eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar foto:', error);
        res.status(500).json({ error: 'Error al eliminar la foto' });
    }
});

module.exports = router;