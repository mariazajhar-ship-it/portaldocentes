const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para fotos de docentes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/profes'));
    },
    filename: (req, file, cb) => {
        // Usar el ID del docente como nombre del archivo para evitar colisiones
        const docenteId = req.params.id;
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `docente_${docenteId}${ext}`;
        cb(null, filename);
    }
});

// Filtrar solo archivos de imagen
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // Máximo 2 MB
    }
});

module.exports = upload;
