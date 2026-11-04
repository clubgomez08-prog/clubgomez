-- Premios extra del mismo sorteo: mismo número, misma página.
-- No borra sorteos, ventas ni números.
-- Pegar en Supabase → SQL Editor → Run

ALTER TABLE public.sorteos_rifa
  ADD COLUMN IF NOT EXISTS premios_extra JSONB NOT NULL DEFAULT '[]'::jsonb;
