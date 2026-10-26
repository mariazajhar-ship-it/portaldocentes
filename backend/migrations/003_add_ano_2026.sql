-- ============================================
-- MIGRACIÓN 003: Agregar Año Escolar 2026
-- ============================================
-- Creado: Octubre 2026
-- Descripción: Inserta el año escolar 2026 en la tabla existente
--              `anos_escolares`. No se crea ninguna tabla nueva ni se
--              modifica la estructura de `anos_escolares`; se conserva
--              la relación `horarios.ano_id -> anos_escolares.id`.
--              INSERT IGNORE: si el año ya existe, no se duplica ni se
--              modifica ningún registro existente.
-- ============================================

USE `liceo_tame`;

INSERT IGNORE INTO `anos_escolares` (`nombre`, `activo`)
VALUES ('2026', 1);
