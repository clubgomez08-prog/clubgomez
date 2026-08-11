-- Bold como origen de membresía / método de pago
-- Ejecutar en Supabase → SQL Editor → Run

ALTER TABLE public.membresias DROP CONSTRAINT IF EXISTS membresias_origen_check;
ALTER TABLE public.membresias
  ADD CONSTRAINT membresias_origen_check
  CHECK (origen IN ('whatsapp', 'wompi', 'manual', 'admin', 'bold'));

ALTER TABLE public.pagos DROP CONSTRAINT IF EXISTS pagos_metodo_check;
ALTER TABLE public.pagos
  ADD CONSTRAINT pagos_metodo_check
  CHECK (metodo IN ('pendiente', 'wompi', 'transferencia', 'efectivo', 'otro', 'bold'));
