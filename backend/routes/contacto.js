const express = require('express');
const router = express.Router();
const { getContacto, updateContacto } = require('../controllers/contactoController');
const verifyToken = require('../middleware/auth');

// 🔓 Público: lo consume el portal público (index.html / docente.html)
router.get('/', getContacto);

// 🔐 Admin: editable desde el Panel Administrativo (pestaña "Contacto")
router.put('/', verifyToken, updateContacto);

module.exports = router;
