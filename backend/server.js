const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dashboardRoutes = require('./routes/dashboard');
const materiasRoutes = require('./routes/materias');
const horariosRoutes = require('./routes/horarios');
const sedesRoutes = require('./routes/sedes');
const contactoRoutes = require('./routes/contacto');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 🔒 SEGURIDAD
// ============================================

// Helmet: cabeceras de seguridad HTTP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// CORS: solo orígenes permitidos (configurable vía env)
const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (postman, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS: Origen bloqueado: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting: login (5 intentos cada 15 minutos)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Servir fotos de docentes
app.use('/profes', express.static(path.join(__dirname, '../public/profes')));

// Rutas de la API
const authRoutes = require('./routes/auth');
const docenteRoutes = require('./routes/docentes');
const areaRoutes = require('./routes/areas');
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/sedes', sedesRoutes);
app.use('/api/contacto', contactoRoutes);

// Rate limiting específico para login (se aplica antes de authRoutes)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/docentes', docenteRoutes);
app.use('/api/areas', areaRoutes);

// Ruta para manejar el acceso al portal
app.get('/portal', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/portal.html'));
});

// Ruta para ver el perfil del docente (público)
app.get('/docente/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/docente.html'));
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📋 Portal admin: http://localhost:${PORT}/portal`);
    console.log(`🔍 Consulta pública: http://localhost:${PORT}`);
    console.log(`📁 Conectado a la base de datos '${process.env.DB_NAME}'`);
    console.log(`==================================================`);
});