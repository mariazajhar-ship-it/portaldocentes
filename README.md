# 🏫 Liceo Tame — Sistema de Gestión de Docentes

Sistema web para administrar la base de datos de **profesores y horarios** de la institución.
Incluye un **portal público** de consulta de docentes y un **panel administrativo** protegido.

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express 4, MySQL 8 (`mysql2`), JWT, bcrypt, multer |
| Frontend | HTML + CSS + JavaScript vanilla (sin frameworks) |
| Gráficas | Chart.js (CDN) |
| Entorno | Laragon (Windows) |

## 📁 Estructura

```
├── backend/
│   ├── config/        → Conexión a MySQL (pool)
│   ├── controllers/   → Lógica de negocio (auth, docentes, áreas, sedes)
│   ├── middleware/    → Verificación JWT y subida de fotos (multer)
│   ├── migrations/    → Migraciones SQL incrementales
│   ├── routes/        → Endpoints de la API
│   └── server.js      → Punto de entrada del servidor
├── public/
│   ├── index.html     → Portal público (consulta de docentes)
│   ├── docente.html   → Perfil público de un docente
│   ├── portal.html    → Panel administrativo
│   ├── portal-*.js    → Módulos del panel (auth, docentes, horarios, etc.)
│   ├── app.js         → Lógica del portal público
│   └── styles.css     → Estilos globales
└── database.sql       → Esquema completo + datos de prueba (fuente única)
```

## 🚀 Puesta en marcha (Laragon)

1. **Base de datos:** ejecutar `database.sql` en MySQL (crea la BD `liceo_tame` con datos de prueba).
2. **Dependencias:**
   ```bash
   cd backend
   npm install
   ```
3. **Variables de entorno:** copiar `backend/.env.example` a `backend/.env` y ajustar credenciales.
4. **Ejecutar:**
   ```bash
   cd backend
   npm run dev   # o: npm start
   ```

## 🔗 URLs

| Recurso | URL |
|---|---|
| Portal público | `http://localhost:3000/` |
| Panel admin | `http://localhost:3000/portal` |
| Perfil docente | `http://localhost:3000/docente/:id` |

## 🔐 Acceso al panel

- **Usuario:** `admin`
- **Contraseña:** `admin` — **cámbiala al iniciar sesión** (botón "Cambiar contraseña" en el panel).

## 🗄️ Base de datos

- `database.sql` es la **fuente única de verdad**: contiene el esquema completo (incluyendo `sedes`) y datos de prueba.
- Las migraciones en `backend/migrations/` documentan cambios incrementales ya aplicados.
- Nota: `C:/pilib/litame.sql` es un dump antiguo de HeidiSQL; usar `database.sql` en su lugar.

## 🔒 Seguridad

- Passwords con `bcrypt` (12 rondas) y JWT con expiración de 24 h.
- Rate limit en login (5 intentos / 15 min) y cierre de sesión por inactividad (30 min).
- La API pública **nunca** expone la cédula de los docentes.
- Helmet + CORS configurados (orígenes permitidos vía `CORS_ORIGINS`).
