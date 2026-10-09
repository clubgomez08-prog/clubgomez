-- Club Gómez: historial de cambios del panel + planes editables
-- Pegar en Supabase → SQL Editor → Run
--
-- No cambia precios ni oportunidades: deja los planes exactamente como hoy
-- (Élite 100.000 / 6 · Selecto 50.000 / 3 · Esencial 20.000 / 1).

-- ---------------------------------------------------------------------------
-- 1) Historial de cambios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actividad_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,
  accion TEXT NOT NULL,
  detalle JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actividad_admin_created
  ON public.actividad_admin (created_at DESC);

ALTER TABLE public.actividad_admin ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2) Planes: campos que hoy solo están en el código
-- ---------------------------------------------------------------------------
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS precio_antes INTEGER;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS equiv TEXT;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.planes SET
  nombre = 'Élite', precio_cop = 100000, claves = 6, precio_antes = 180000,
  tag = 'Vives la mejor versión del Club', equiv = 'La experiencia completa del Club'
WHERE id = 'elite';

UPDATE public.planes SET
  nombre = 'Selecto', precio_cop = 50000, claves = 3, precio_antes = 90000,
  tag = 'Vas en serio con el Club', equiv = 'El equilibrio ideal'
WHERE id = 'selecto';

UPDATE public.planes SET
  nombre = 'Esencial', precio_cop = 20000, claves = 1, precio_antes = 30000,
  tag = 'Arrancas con el Club', equiv = 'O sea, entras mes a mes'
WHERE id = 'esencial';

-- Verificar
-- SELECT id, nombre, precio_cop, claves, precio_antes FROM public.planes ORDER BY precio_cop DESC;
