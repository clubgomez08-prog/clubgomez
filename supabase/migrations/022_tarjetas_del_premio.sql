-- Tarjetas del premio (título, texto y sticker) y el interruptor del bloque del medio.
-- No borra sorteos, fotos, ventas ni números.
-- Pegar en Supabase → SQL Editor → Run

ALTER TABLE public.sorteos_rifa
  ADD COLUMN IF NOT EXISTS mostrar_destacado BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.sorteos_rifa
  ADD COLUMN IF NOT EXISTS bloque_tarjetas JSONB;
