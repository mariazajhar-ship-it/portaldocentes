-- ============================================
-- MIGRACIÓN 002: Agregar Grado de Escalafón
-- ============================================
-- Creado: Octubre 2026
-- Descripción: Agrega el campo `grado_escalafon` a la tabla docentes.
--              Dato solo visible en el panel administrativo (nunca
--              se expone en las rutas públicas del portal).
--              No afecta los datos existentes: la columna se crea
--              como NULL y los docentes actuales quedan sin valor
--              hasta que se edite su ficha.
-- ============================================

USE `liceo_tame`;

ALTER TABLE `docentes`
  ADD COLUMN `grado_escalafon` varchar(100) DEFAULT NULL AFTER `nivel_academico`;
