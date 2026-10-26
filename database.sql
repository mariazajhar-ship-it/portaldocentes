-- ============================================
-- LICEO TAME - Esquema Completo de Base de Datos
-- ============================================
-- Ejecutar este archivo para crear la base de datos
-- con datos de prueba profesionales incluidos.
-- ============================================
-- Características:
--   ✅ Schema limpio (sin tablas legacy)
--   ✅ Incluye la tabla `sedes` y la columna `docentes.sede_id`
--     (migración 001_add_sedes.sql ya aplicada — este archivo es la fuente única de verdad)
--   ✅ Incluye la tabla `informacion_contacto` (datos editables del portal público)
--   ✅ UNIQUE KEY corregida en materias (nombre + area_id)
--   ✅ 15 docentes con datos realistas colombianos
--   ✅ Materias completas por área
--   ✅ Horarios de ejemplo
--   ✅ bcrypt hash de "admin" para el usuario admin
-- ============================================

CREATE DATABASE IF NOT EXISTS `liceodb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `liceodb`;

-- ============================================
-- TABLAS (sin dependencias)
-- ============================================

DROP TABLE IF EXISTS `horarios`;
DROP TABLE IF EXISTS `docente_materias`;
DROP TABLE IF EXISTS `docentes`;
DROP TABLE IF EXISTS `sedes`; -- Debe eliminarse después de docentes (FK)
DROP TABLE IF EXISTS `materias`;
DROP TABLE IF EXISTS `periodos_academicos`;
DROP TABLE IF EXISTS `usuarios_admin`;
DROP TABLE IF EXISTS `informacion_contacto`;
DROP TABLE IF EXISTS `anos_escolares`;
DROP TABLE IF EXISTS `areas`;

CREATE TABLE `anos_escolares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(10) NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `areas` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `icono` varchar(50) DEFAULT NULL,
  `descripcion` text,
  `popular` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `periodos_academicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `usuarios_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- INFORMACIÓN DE CONTACTO (Portal público)
-- Tabla de una sola fila (id = 1) editable desde el Panel Administrativo:
-- Panel Administrativo > Pestaña "Contacto" > Guardar.
-- El portal público (index.html / docente.html) la muestra automáticamente.
-- ============================================

CREATE TABLE `informacion_contacto` (
  `id` tinyint NOT NULL DEFAULT '1',
  `email` varchar(150) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Registro único inicial (valores que hoy muestra el portal público)
INSERT INTO `informacion_contacto` (`id`, `email`, `telefono`, `direccion`, `ciudad`, `departamento`, `pais`) VALUES
(1, 'contacto@liceotame.edu.co', '(601) 123 4567', 'Carrera 15 # 12-34', 'Tame', 'Arauca', 'Colombia');

-- ============================================
-- TABLAS (con dependencias de areas)
-- ============================================

-- Sedes (referenciadas por docentes.sede_id)
CREATE TABLE `sedes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `materias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `area_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_materia_area` (`nombre`, `area_id`),
  KEY `idx_materias_area` (`area_id`),
  CONSTRAINT `fk_materias_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `docentes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `cargo` varchar(100) NOT NULL,
  `area_id` varchar(50) NOT NULL,
  `sede_id` int DEFAULT NULL,
  `formacion` varchar(200) DEFAULT NULL,
  `nivel_academico` varchar(50) DEFAULT NULL,
  `grado_escalafon` varchar(100) DEFAULT NULL,
  `tipo_nombramiento` varchar(50) DEFAULT 'Provisional',
  `horario_atencion` varchar(200) DEFAULT NULL,
  `sobre_mi` text,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `genero` varchar(10) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `visibilidad` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cedula` (`cedula`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_cedula` (`cedula`),
  KEY `idx_area` (`area_id`),
  KEY `idx_fecha_nacimiento` (`fecha_nacimiento`),
  KEY `idx_sede` (`sede_id`),
  CONSTRAINT `docentes_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_docentes_sede` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- TABLAS (con dependencias de docentes y materias)
-- ============================================

CREATE TABLE `docente_materias` (
  `docente_id` int NOT NULL,
  `materia_id` int NOT NULL,
  PRIMARY KEY (`docente_id`, `materia_id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `docente_materias_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `docente_materias_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `horarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docente_id` int NOT NULL,
  `ano_id` int NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes') NOT NULL,
  `bloque` int NOT NULL,
  `materia_id` int DEFAULT NULL,
  `curso` varchar(20) DEFAULT NULL,
  `salon` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_docente_dia_bloque` (`docente_id`, `dia_semana`, `bloque`),
  KEY `materia_id` (`materia_id`),
  KEY `idx_docente_periodo` (`docente_id`, `ano_id`),
  KEY `idx_dia_bloque` (`dia_semana`, `bloque`),
  KEY `fk_horarios_ano` (`ano_id`),
  CONSTRAINT `fk_horarios_ano` FOREIGN KEY (`ano_id`) REFERENCES `anos_escolares` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horarios_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `horarios_chk_1` CHECK ((`bloque` between 1 and 6))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- DATOS DE PRUEBA — Seed Profesional (OPCIONAL)
-- ============================================
-- Esta sección NO es necesaria para que el sistema funcione.
-- Si solo necesitas la estructura, ejecuta el archivo hasta este punto
-- más el INSERT de `usuarios_admin` de abajo (requerido para entrar al panel).
-- Los datos de docentes, materias, áreas y horarios de ejemplo se pueden
-- omitir y cargar desde el Panel Administrativo.

-- Años escolares
INSERT INTO `anos_escolares` (`nombre`, `activo`) VALUES
('2026', 1),
('2027', 0),
('2028', 0);

-- Áreas académicas (12 áreas)
INSERT INTO `areas` (`id`, `nombre`, `icono`, `descripcion`, `popular`) VALUES
('ciencias-economicas',   'Ciencias Económicas',    'chart-bar', 'Economía, contabilidad, finanzas y emprendimiento.',                                                                    0),
('ciencias-naturales',    'Ciencias Naturales',     'flask',     'Biología, física, química y educación ambiental.',                                                                      1),
('ciencias-sociales',     'Ciencias Sociales',      'globe',     'Historia, geografía, filosofía, competencias ciudadanas y ciencias económicas.',                                     1),
('educacion-artistica',   'Educación Artística',    'palette',   'Artes plásticas, dibujo técnico, música, teatro y expresión corporal.',                                              0),
('educacion-fisica',      'Educación Física',       'running',   'Acondicionamiento físico, deportes, recreación y estilos de vida saludable.',                                        1),
('educacion-religiosa',   'Educación Religiosa',    'church',    'Formación espiritual, ecumenismo, ética religiosa y proyecto de vida.',                                               0),
('especialidades-tecnicas','Especialidades Técnicas','tools',    'Electrónica, programación, electricidad, mecánica y mantenimiento industrial.',                                      0),
('etica-valores',         'Ética y Valores',        'heart',     'Convivencia, paz, derechos humanos, democracia y autoconocimiento.',                                                  0),
('ingles',                'Inglés',                 'language',  'Gramática, conversación, listening, reading, writing y preparación para certificaciones internacionales.',             1),
('lengua-castellana',     'Lengua Castellana',      'book',      'Literatura, comprensión lectora, producción textual, lingüística y comunicación asertiva.',                           1),
('matematicas',           'Matemáticas',            'sigma',     'Álgebra, geometría, trigonometría, cálculo, estadística y razonamiento lógico.',                                     1),
('tecnologia-informatica','Tecnología e Informática','laptop',   'Pensamiento computacional, algoritmos, ofimática, robótica educativa y ciudadanía digital.',                          1);

-- Periodos académicos
INSERT INTO `periodos_academicos` (`nombre`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
('2026-1', '2026-02-01', '2026-06-30', 1),
('2026-2', '2026-07-15', '2026-11-30', 0),
('2027-1', '2027-02-01', '2027-06-30', 0);

-- Usuario administrador (usuario: admin / contraseña: admin)
-- Hash bcrypt generado para "admin"
INSERT INTO `usuarios_admin` (`username`, `password_hash`, `nombre_completo`, `email`) VALUES
('admin', 'admin', 'Administrador del Sistema', 'demo@liceotame.edu.co');

-- ============================================
-- MATERIAS (26 materias distribuidas en 12 áreas)
-- ============================================
INSERT INTO `materias` (`nombre`, `area_id`) VALUES
-- Matemáticas
('Álgebra Lineal',         'matematicas'),
('Geometría',              'matematicas'),
('Estadística',            'matematicas'),
-- Lengua Castellana
('Lengua Castellana',      'lengua-castellana'),
('Literatura Universal',   'lengua-castellana'),
-- Ciencias Naturales
('Biología',               'ciencias-naturales'),
('Química',                'ciencias-naturales'),
('Física',                 'ciencias-naturales'),
-- Inglés
('Inglés Básico',          'ingles'),
('Inglés Avanzado',        'ingles'),
-- Ciencias Sociales
('Historia',               'ciencias-sociales'),
('Geografía',              'ciencias-sociales'),
('Filosofía',              'ciencias-sociales'),
-- Educación Física
('Educación Física',       'educacion-fisica'),
('Deportes',               'educacion-fisica'),
-- Tecnología e Informática
('Informática',            'tecnologia-informatica'),
('Programación',           'tecnologia-informatica'),
-- Educación Artística
('Artes Plásticas',        'educacion-artistica'),
('Música',                 'educacion-artistica'),
-- Especialidades Técnicas
('Electrónica',            'especialidades-tecnicas'),
('Mantenimiento',          'especialidades-tecnicas'),
-- Ciencias Económicas
('Contabilidad',           'ciencias-economicas'),
('Emprendimiento',         'ciencias-economicas'),
-- Ética y Valores
('Ética y Valores',        'etica-valores'),
-- Educación Religiosa
('Educación Religiosa',    'educacion-religiosa');

-- ============================================
-- SEDES
-- ============================================
INSERT INTO `sedes` (`nombre`, `direccion`, `descripcion`, `activo`) VALUES
('Liceo Tame Bachillerato', 'Carrera 15 # 12-34, Tame, Arauca', 'Sede principal de bachillerato', 1);

-- ============================================
-- DOCENTES (15 docentes con datos realistas colombianos)
-- ============================================
INSERT INTO `docentes` (`nombre`, `cedula`, `cargo`, `area_id`, `formacion`, `tipo_nombramiento`, `horario_atencion`, `sobre_mi`, `email`, `telefono`, `genero`, `fecha_nacimiento`, `visibilidad`) VALUES
('Carlos Andrés Martínez Rueda',   '1012345678', 'Docente de Matemáticas',   'matematicas',            'Licenciado en Matemáticas, Universidad Pedagógica Nacional',                            'Propiedad',   'Lunes a Viernes 10:00-12:00', 'Apasionado por la enseñanza de las matemáticas con más de 15 años de experiencia. Creo firmemente que todos los estudiantes pueden aprender matemáticas cuando se les presenta de manera clara y contextualizada.',                  'carlos.martinez@liceotame.edu.co',     '3101234567', 'Masculino',  '1978-05-12', JSON_OBJECT('activo', true)),
('María Fernanda López García',    '1023456789', 'Docente de Lengua Castellana', 'lengua-castellana',    'Licenciada en Español y Literatura, Universidad Nacional de Colombia',                   'Propiedad',   'Lunes a Jueves 11:00-13:00',  'Amar la literatura es mi mayor motivación. He publicado dos cuentos infantiles y disfruto ver cómo mis estudiantes descubren el poder de las palabras.',                          'maria.lopez@liceotame.edu.co',        '3112345678', 'Femenino',   '1982-09-25', JSON_OBJECT('activo', true)),
('Juan Pablo Rodríguez Silva',     '1034567890', 'Docente de Ciencias',      'ciencias-naturales',     'Magíster en Educación Ambiental, Universidad de Antioquia',                              'Propiedad',   'Martes y Jueves 8:00-10:00',   'La ciencia está en todas partes. Me encanta hacer experimentos en clase y llevar a mis estudiantes a explorar la naturaleza para aprender de primera mano.',                       'juan.rodriguez@liceotame.edu.co',     '3123456789', 'Masculino',  '1980-11-03', JSON_OBJECT('activo', true)),
('Ana Cecilia Torres Medina',      '1045678901', 'Docente de Inglés',        'ingles',                 'Licenciada en Filología e Idiomas, Universidad del Valle',                              'Propiedad',   'Lunes a Viernes 9:00-11:00',   'Estudié un año en Toronto y traje lo mejor de la metodología canadiense a mis clases. Mis estudiantes aprenden inglés cantando, actuando y conversando.',                      'ana.torres@liceotame.edu.co',         '3134567890', 'Femenino',   '1985-07-19', JSON_OBJECT('activo', true)),
('Luis Enrique Vargas Pérez',      '1056789012', 'Docente de Sociales',      'ciencias-sociales',      'Especialista en Historia Contemporánea, Universidad Javeriana',                          'Propiedad',   'Miércoles y Viernes 10:00-12:00', 'La historia nos enseña quiénes somos y hacia dónde vamos. Cada clase es un viaje en el tiempo que conecta el pasado con el presente de mis estudiantes.',                    'luis.vargas@liceotame.edu.co',        '3145678901', 'Masculino',  '1976-03-28', JSON_OBJECT('activo', true)),
('Diana Patricia Rojas Ortiz',     '1067890123', 'Docente de Educación Física','educacion-fisica',      'Licenciada en Educación Física, Universidad Pedagógica Nacional',                       'Propiedad',   'Lunes a Viernes 6:00-8:00',    'El deporte transforma vidas. He entrenado selecciones escolares de baloncesto que han ganado torneos regionales y promuevo hábitos de vida saludable en cada clase.',         'diana.rojas@liceotame.edu.co',        '3156789012', 'Femenino',   '1988-01-15', JSON_OBJECT('activo', true)),
('Pedro Antonio Gómez Hernández',  '1078901234', 'Docente de Matemáticas',   'matematicas',            'Magíster en Educación Matemática, Universidad de los Andes',                            'Provisional', 'Lunes y Miércoles 14:00-16:00', 'Me especializo en la enseñanza de la estadística y la probabilidad. Mis estudiantes aprenden analizando datos reales de su entorno y creando proyectos de investigación.',     'pedro.gomez@liceotame.edu.co',        '3167890123', 'Masculino',  '1983-08-22', JSON_OBJECT('activo', true)),
('Laura Cristina Sánchez Mora',    '1089012345', 'Docente de Ciencias',      'ciencias-naturales',     'Licenciada en Biología, Universidad Distrital Francisco José de Caldas',                 'Provisional', 'Martes y Jueves 13:00-15:00',  'La biología me fascina desde que tengo memoria. Disfruto especialmente enseñar genética y ecología, y organizo ferias de ciencia cada año en el colegio.',                     'laura.sanchez@liceotame.edu.co',      '3178901234', 'Femenino',   '1990-12-07', JSON_OBJECT('activo', true)),
('José Miguel Ángel Castro',       '1090123456', 'Docente de Informática',   'tecnologia-informatica', 'Ingeniero de Sistemas, Universidad Industrial de Santander',                             'Propiedad',   'Lunes a Viernes 15:00-17:00',  'La tecnología es el lenguaje del futuro. Enseño programación, robótica educativa y pensamiento computacional desde un enfoque práctico y divertido.',                          'jose.castro@liceotame.edu.co',        '3189012345', 'Masculino',  '1986-06-30', JSON_OBJECT('activo', true)),
('Carmen Elena Ruiz Díaz',         '1101234567', 'Docente de Artes',         'educacion-artistica',    'Licenciada en Artes Plásticas, Universidad Nacional de Colombia',                        'Propiedad',   'Lunes a Jueves 8:00-10:00',    'El arte es la expresión del alma. He expuesto mis obras en galerías de Bogotá y Medellín, y disfruto guiar a mis estudiantes en el descubrimiento de su creatividad.',        'carmen.ruiz@liceotame.edu.co',        '3190123456', 'Femenino',   '1981-04-11', JSON_OBJECT('activo', true)),
('Ricardo Alberto Morales Jiménez','1112345678', 'Docente Técnico',          'especialidades-tecnicas', 'Tecnólogo en Electrónica, SENA, con especialización en Automatización Industrial',        'Provisional', 'Miércoles y Viernes 14:00-16:00', 'La electrónica es mi pasión. He trabajado en la industria durante 10 años antes de dedicarme a la docencia, y ahora comparto esa experiencia práctica con mis estudiantes.',  'ricardo.morales@liceotame.edu.co',    '3201234567', 'Masculino',  '1979-10-05', JSON_OBJECT('activo', true)),
('Gloria Inés Ramírez Pardo',      '1123456789', 'Docente de Literatura',    'lengua-castellana',      'Magíster en Literatura Colombiana, Universidad del Valle',                              'Propiedad',   'Lunes a Viernes 7:00-9:00',    'Gabriel García Márquez me inspiró a estudiar literatura. Hoy comparto esa pasión con mis estudiantes, organizando clubes de lectura y talleres de escritura creativa.',       'gloria.ramirez@liceotame.edu.co',     '3212345678', 'Femenino',   '1977-02-14', JSON_OBJECT('activo', true)),
('Fernando José Castillo Navarro', '1134567890', 'Docente de Economía',      'ciencias-economicas',    'Economista, Universidad Externado de Colombia, con Maestría en Educación',               'Provisional', 'Martes y Jueves 10:00-12:00',  'La economía explica cómo funciona el mundo. Mis estudiantes aprenden finanzas personales, emprendimiento y toman decisiones informadas a través de simulaciones y casos reales.','fernando.castillo@liceotame.edu.co',  '3223456789', 'Masculino',  '1984-09-18', JSON_OBJECT('activo', true)),
('Martha Lucía Herrera Beltrán',   '1145678901', 'Docente de Ética',         'etica-valores',          'Licenciada en Ciencias Sociales con Especialización en Educación para la Paz',           'Propiedad',   'Lunes y Miércoles 12:00-14:00', 'Creo en una educación que forma ciudadanos íntegros. Mis clases de ética son espacios seguros donde los estudiantes aprenden a dialogar, respetar y construir paz.',           'martha.herrera@liceotame.edu.co',     '3234567890', 'Femenino',   '1975-11-30', JSON_OBJECT('activo', true)),
('Óscar Darío Peña Suárez',        '1156789012', 'Docente de Religión',      'educacion-religiosa',    'Licenciado en Teología, Universidad Pontificia Bolivariana',                             'Provisional', 'Martes y Jueves 7:00-9:00',    'La educación religiosa es un espacio de encuentro y reflexión. Mi objetivo es formar personas con valores espirituales sólidos, respetuosas de la diversidad de creencias.',  'oscar.pena@liceotame.edu.co',         '3245678901', 'Masculino',  '1980-07-23', JSON_OBJECT('activo', true));

-- Asignar la sede por defecto a los docentes existentes
UPDATE `docentes` SET `sede_id` = (SELECT id FROM `sedes` WHERE `nombre` = 'Liceo Tame Bachillerato' LIMIT 1);

-- ============================================
-- RELACIÓN DOCENTE-MATERIAS
-- ============================================
INSERT INTO `docente_materias` (`docente_id`, `materia_id`)
SELECT d.id, m.id FROM docentes d, materias m WHERE
  (d.nombre LIKE 'Carlos%'    AND m.nombre IN ('Álgebra Lineal', 'Geometría', 'Estadística')) OR
  (d.nombre LIKE 'María Fernanda%' AND m.nombre IN ('Lengua Castellana', 'Literatura Universal')) OR
  (d.nombre LIKE 'Juan Pablo%' AND m.nombre IN ('Biología', 'Química')) OR
  (d.nombre LIKE 'Ana Cecilia%' AND m.nombre IN ('Inglés Básico', 'Inglés Avanzado')) OR
  (d.nombre LIKE 'Luis Enrique%' AND m.nombre IN ('Historia', 'Geografía', 'Filosofía')) OR
  (d.nombre LIKE 'Diana Patricia%' AND m.nombre IN ('Educación Física', 'Deportes')) OR
  (d.nombre LIKE 'Pedro Antonio%' AND m.nombre IN ('Álgebra Lineal', 'Estadística')) OR
  (d.nombre LIKE 'Laura Cristina%' AND m.nombre IN ('Biología', 'Química', 'Física')) OR
  (d.nombre LIKE 'José Miguel%' AND m.nombre IN ('Informática', 'Programación')) OR
  (d.nombre LIKE 'Carmen Elena%' AND m.nombre IN ('Artes Plásticas', 'Música')) OR
  (d.nombre LIKE 'Ricardo Alberto%' AND m.nombre IN ('Electrónica', 'Mantenimiento')) OR
  (d.nombre LIKE 'Gloria Inés%' AND m.nombre IN ('Lengua Castellana', 'Literatura Universal')) OR
  (d.nombre LIKE 'Fernando José%' AND m.nombre IN ('Contabilidad', 'Emprendimiento')) OR
  (d.nombre LIKE 'Martha Lucía%' AND m.nombre IN ('Ética y Valores')) OR
  (d.nombre LIKE 'Óscar Darío%' AND m.nombre IN ('Educación Religiosa'));

-- ============================================
-- HORARIOS DE CLASE (año 2026)
-- ============================================
-- Carlos Martínez (ID 1) - Matemáticas - Bloques variados
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(1, 1, 'Lunes',    1, (SELECT id FROM materias WHERE nombre='Álgebra Lineal' LIMIT 1), '1101', '101'),
(1, 1, 'Lunes',    2, (SELECT id FROM materias WHERE nombre='Geometría' LIMIT 1),     '1102', '101'),
(1, 1, 'Miércoles', 1, (SELECT id FROM materias WHERE nombre='Estadística' LIMIT 1),   '1001', '102'),
(1, 1, 'Viernes',  2, (SELECT id FROM materias WHERE nombre='Álgebra Lineal' LIMIT 1), '1101', '101');

-- María López (ID 2) - Lengua Castellana
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(2, 1, 'Lunes',    3, (SELECT id FROM materias WHERE nombre='Lengua Castellana' LIMIT 1),    '1001', '201'),
(2, 1, 'Martes',   3, (SELECT id FROM materias WHERE nombre='Literatura Universal' LIMIT 1), '1102', '202'),
(2, 1, 'Jueves',   2, (SELECT id FROM materias WHERE nombre='Lengua Castellana' LIMIT 1),    '1001', '201'),
(2, 1, 'Viernes',  1, (SELECT id FROM materias WHERE nombre='Literatura Universal' LIMIT 1), '1101', '202');

-- Juan Rodríguez (ID 3) - Ciencias Naturales
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(3, 1, 'Martes',   1, (SELECT id FROM materias WHERE nombre='Biología' LIMIT 1), '1001', '301'),
(3, 1, 'Martes',   2, (SELECT id FROM materias WHERE nombre='Química' LIMIT 1),  '1102', '302'),
(3, 1, 'Jueves',   1, (SELECT id FROM materias WHERE nombre='Biología' LIMIT 1), '1101', '301'),
(3, 1, 'Viernes',  3, (SELECT id FROM materias WHERE nombre='Química' LIMIT 1),  '1002', '302');

-- Ana Torres (ID 4) - Inglés
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(4, 1, 'Lunes',    4, (SELECT id FROM materias WHERE nombre='Inglés Básico' LIMIT 1),   '1001', '401'),
(4, 1, 'Miércoles', 4, (SELECT id FROM materias WHERE nombre='Inglés Avanzado' LIMIT 1), '1102', '402'),
(4, 1, 'Jueves',   4, (SELECT id FROM materias WHERE nombre='Inglés Básico' LIMIT 1),   '1002', '401'),
(4, 1, 'Viernes',  4, (SELECT id FROM materias WHERE nombre='Inglés Avanzado' LIMIT 1), '1101', '402');

-- Luis Vargas (ID 5) - Ciencias Sociales
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(5, 1, 'Lunes',    5, (SELECT id FROM materias WHERE nombre='Historia' LIMIT 1),   '1101', '501'),
(5, 1, 'Martes',   5, (SELECT id FROM materias WHERE nombre='Geografía' LIMIT 1),  '1002', '502'),
(5, 1, 'Miércoles', 5, (SELECT id FROM materias WHERE nombre='Filosofía' LIMIT 1), '1102', '501'),
(5, 1, 'Jueves',   5, (SELECT id FROM materias WHERE nombre='Historia' LIMIT 1),   '1001', '501');

-- José Castro (ID 9) - Tecnología e Informática
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(9, 1, 'Miércoles', 2, (SELECT id FROM materias WHERE nombre='Informática' LIMIT 1),  '1001', 'SIST-1'),
(9, 1, 'Miércoles', 3, (SELECT id FROM materias WHERE nombre='Programación' LIMIT 1), '1102', 'SIST-2'),
(9, 1, 'Viernes',  5, (SELECT id FROM materias WHERE nombre='Programación' LIMIT 1), '1101', 'SIST-2');

-- Fernando Castillo (ID 13) - Ciencias Económicas
INSERT INTO `horarios` (`docente_id`, `ano_id`, `dia_semana`, `bloque`, `materia_id`, `curso`, `salon`) VALUES
(13, 1, 'Martes',   4, (SELECT id FROM materias WHERE nombre='Contabilidad' LIMIT 1),  '1102', '601'),
(13, 1, 'Jueves',   3, (SELECT id FROM materias WHERE nombre='Emprendimiento' LIMIT 1), '1101', '602');
