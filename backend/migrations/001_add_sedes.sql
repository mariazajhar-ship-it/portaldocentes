-- ============================================
-- MIGRACIÓN 001: Agregar Sedes
-- ============================================
-- Creado: Julio 2026
-- Descripción: Crea la tabla de sedes y agrega
-- el campo sede_id a la tabla docentes.
-- ============================================

USE `liceo_tame`;

-- ============================================
-- 1. CREAR TABLA DE SEDES
-- ============================================
CREATE TABLE IF NOT EXISTS `sedes` (
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

-- ============================================
-- 2. SEDE POR DEFECTO
-- ============================================
INSERT INTO `sedes` (`nombre`, `direccion`, `descripcion`, `activo`) VALUES
('Liceo Tame Bachillerato', 'Carrera 15 # 12-34, Tame, Arauca', 'Sede principal de bachillerato', 1);

-- ============================================
-- 3. AGREGAR COLUMNA sede_id A docentes
-- ============================================
ALTER TABLE `docentes`
  ADD COLUMN `sede_id` int DEFAULT NULL AFTER `area_id`,
  ADD KEY `idx_sede` (`sede_id`),
  ADD CONSTRAINT `fk_docentes_sede` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`) ON DELETE SET NULL;

-- ============================================
-- 4. ASIGNAR SEDE POR DEFECTO A DOCENTES EXISTENTES
-- ============================================
UPDATE `docentes` SET `sede_id` = 1 WHERE `sede_id` IS NULL;
