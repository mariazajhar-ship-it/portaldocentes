const express = require('express');
const router = express.Router();
const {
    getSedes,
    getSedeById,
    createSede,
    updateSede,
    deleteSede
} = require('../controllers/sedeController');
const verifyToken = require('../middleware/auth');

// Rutas públicas
router.get('/', getSedes);
router.get('/:id', getSedeById);

// Rutas protegidas
router.post('/', verifyToken, createSede);
router.put('/:id', verifyToken, updateSede);
router.delete('/:id', verifyToken, deleteSede);

module.exports = router;
