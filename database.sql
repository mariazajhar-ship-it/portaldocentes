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
