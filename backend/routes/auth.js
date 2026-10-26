const express = require('express');
const router = express.Router();
const { login, verify, changePassword } = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

router.post('/login', login);
router.get('/verify', verifyToken, verify);
router.put('/password', verifyToken, changePassword);

module.exports = router;