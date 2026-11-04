-- Permite ocultar el bloque del medio (el que repite "Elige tu membresía").
-- No borra sorteos, fotos, ventas ni números.
-- Pegar en Supabase → SQL Editor → Run

ALTER TABLE public.sorteos_rifa
  ADD COLUMN IF NOT EXISTS mostrar_destacado BOOLEAN NOT NULL DEFAULT true;
