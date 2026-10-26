const express = require('express');
const router = express.Router();
const {
    getAreas,
    getAreaById,
    createArea,
    updateArea,
    deleteArea
} = require('../controllers/areaController');
const verifyToken = require('../middleware/auth');

// Rutas públicas
router.get('/', getAreas);
router.get('/:id', getAreaById);

// Rutas protegidas
router.post('/', verifyToken, createArea);
router.put('/:id', verifyToken, updateArea);
router.delete('/:id', verifyToken, deleteArea);

module.exports = router;