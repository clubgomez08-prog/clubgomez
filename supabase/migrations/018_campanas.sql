-- Club Gómez: campañas (hero / destacado) editables desde el panel
-- Pegar en Supabase → SQL Editor → Run
--
-- Solo guarda datos. La landing todavía NO lee esta tabla.

CREATE TABLE IF NOT EXISTS public.campanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  periodo TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT false,
  hero_eyebrow TEXT,
  hero_titulo TEXT,
  hero_titulo_acento TEXT,
  hero_efectivo TEXT,
  hero_cta TEXT,
  hero_img_pc TEXT,
  hero_img_movil TEXT,
  fecha_sorteo DATE,
  loteria TEXT,
  fotos_destacado TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solo una campaña activa a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_campanas_una_activa
  ON public.campanas (activa)
  WHERE activa;

ALTER TABLE public.campanas ENABLE ROW LEVEL SECURITY;

-- Campaña actual (Crypton) con los mismos valores que tiene hoy la landing
INSERT INTO public.campanas
  (nombre, periodo, activa, hero_eyebrow, hero_titulo, hero_titulo_acento,
   hero_efectivo, hero_cta, hero_img_pc, hero_img_movil, fecha_sorteo, loteria,
   fotos_destacado)
SELECT
  'Yamaha Crypton 0 km + $1.000.000', '2026-10', true,
  '0 km · la nueva moto del Club', 'YAMAHA', 'CRYPTON',
  '+ $1.000.000 EN EFECTIVO', '¡Participar!',
  '/club-gomez/hero-crypton-pc.png', '/club-gomez/hero-crypton-movil.jpg',
  '2026-10-17', 'Lotería de Boyacá',
  ARRAY[
    '/club-gomez/daniel-crypton.jpg',
    '/club-gomez/crypton-frente-sol.jpg',
    '/club-gomez/crypton-trasera-sol.jpg'
  ]
WHERE NOT EXISTS (SELECT 1 FROM public.campanas);

-- Carpeta pública para las imágenes que se suban desde el panel
INSERT INTO storage.buckets (id, name, public)
VALUES ('campanas', 'campanas', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar
-- SELECT nombre, periodo, activa, fecha_sorteo FROM public.campanas;
-- SELECT id, public FROM storage.buckets;
