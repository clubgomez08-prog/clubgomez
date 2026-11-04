-- Sorteos independientes: cada uno con su página, sus planes y su bolillero.
-- No borra clientes, ventas, números ni pagos.
-- Agosto y octubre quedan sin sorteo (historial). Solo noviembre (el 537) pasa a la FZ.
-- Pegar en Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS public.sorteos_rifa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'en_venta', 'cerrado')),
  es_principal BOOLEAN NOT NULL DEFAULT false,
  trabajando BOOLEAN NOT NULL DEFAULT false,
  fecha_sorteo DATE,
  loteria TEXT,
  premio TEXT,
  premio_extra TEXT,
  hero_eyebrow TEXT,
  hero_titulo TEXT,
  hero_titulo_acento TEXT,
  hero_efectivo TEXT,
  hero_cta TEXT,
  hero_img_pc TEXT,
  hero_img_movil TEXT,
  fotos_destacado TEXT[] NOT NULL DEFAULT '{}',
  texto_planes TEXT,
  texto_footer TEXT,
  texto_banda TEXT,
  color_fondo TEXT NOT NULL DEFAULT '#050607',
  color_texto TEXT NOT NULL DEFAULT '#ffffff',
  color_acento TEXT NOT NULL DEFAULT '#B8E351',
  fuente_titulos TEXT NOT NULL DEFAULT 'bebas',
  fuente_texto TEXT NOT NULL DEFAULT 'poppins',
  fondo_imagen TEXT,
  mostrar_testimonios BOOLEAN NOT NULL DEFAULT true,
  mostrar_ver_claves BOOLEAN NOT NULL DEFAULT true,
  mostrar_banda BOOLEAN NOT NULL DEFAULT true,
  fisico_min INTEGER NOT NULL DEFAULT 0,
  fisico_max INTEGER NOT NULL DEFAULT 700,
  web_min INTEGER NOT NULL DEFAULT 701,
  web_max INTEGER NOT NULL DEFAULT 999,
  mensaje_whatsapp TEXT,
  mensaje_correo_asunto TEXT,
  mensaje_correo_cuerpo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sorteos_rifa_una_principal
  ON public.sorteos_rifa (es_principal) WHERE es_principal;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sorteos_rifa_uno_trabajando
  ON public.sorteos_rifa (trabajando) WHERE trabajando;

CREATE TABLE IF NOT EXISTS public.sorteo_planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id UUID NOT NULL REFERENCES public.sorteos_rifa (id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio_cop INTEGER NOT NULL CHECK (precio_cop > 0),
  claves INTEGER NOT NULL CHECK (claves > 0),
  tag TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sorteo_planes_sorteo
  ON public.sorteo_planes (sorteo_id, orden);

ALTER TABLE public.claves
  ADD COLUMN IF NOT EXISTS sorteo_id UUID REFERENCES public.sorteos_rifa (id) ON DELETE RESTRICT;

ALTER TABLE public.membresias
  ADD COLUMN IF NOT EXISTS sorteo_id UUID REFERENCES public.sorteos_rifa (id) ON DELETE RESTRICT;

ALTER TABLE public.sorteos_beneficio
  ADD COLUMN IF NOT EXISTS sorteo_id UUID REFERENCES public.sorteos_rifa (id) ON DELETE SET NULL;

-- Unicidad por sorteo. El historial (sin sorteo) sigue único por mes.
DROP INDEX IF EXISTS public.idx_claves_periodo_numero_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_claves_periodo_numero_sin_sorteo
  ON public.claves (periodo, numero)
  WHERE sorteo_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_claves_sorteo_numero
  ON public.claves (sorteo_id, numero)
  WHERE sorteo_id IS NOT NULL;

INSERT INTO public.sorteos_rifa (
  nombre, slug, estado, es_principal, trabajando,
  fecha_sorteo, loteria, premio, premio_extra,
  hero_eyebrow, hero_titulo, hero_titulo_acento, hero_efectivo, hero_cta,
  hero_img_pc, hero_img_movil, fotos_destacado,
  texto_planes, texto_footer, texto_banda,
  mensaje_whatsapp, mensaje_correo_asunto, mensaje_correo_cuerpo
)
SELECT
  COALESCE(c.nombre, 'FZ 3.0'),
  'fz-noviembre',
  'en_venta',
  true,
  true,
  COALESCE(c.fecha_sorteo, DATE '2026-11-14'),
  COALESCE(c.loteria, 'Lotería de Boyacá'),
  COALESCE(c.nombre, 'FZ 3.0 modelo 2027'),
  NULLIF(c.hero_efectivo, ''),
  c.hero_eyebrow,
  c.hero_titulo,
  c.hero_titulo_acento,
  c.hero_efectivo,
  COALESCE(c.hero_cta, '¡Participar!'),
  c.hero_img_pc,
  c.hero_img_movil,
  COALESCE(c.fotos_destacado, '{}'),
  'Entras a ' || COALESCE(c.nombre, 'este sorteo') || '.',
  COALESCE(c.nombre, 'Club Gómez'),
  COALESCE(c.nombre, 'Club Gómez'),
  'Hola {nombre}, bienvenido a Daniel Gomez Stunt te informamos que has comprado una boleta con el número {numeros} para {premio}, la cual juega el día {fecha} con las tres últimas cifras de la {loteria}, mucha suerte',
  'Tus números — {premio}',
  'Hola {nombre}. Compraste el número {numeros} para {premio}. Juega el {fecha} con las tres últimas cifras de la {loteria}.'
FROM public.campanas c
WHERE c.activa = true
  AND NOT EXISTS (SELECT 1 FROM public.sorteos_rifa WHERE slug = 'fz-noviembre')
LIMIT 1;

INSERT INTO public.sorteo_planes (sorteo_id, nombre, precio_cop, claves, tag, orden)
SELECT s.id, p.nombre, p.precio_cop, p.claves, p.tag,
  CASE p.id WHEN 'elite' THEN 1 WHEN 'selecto' THEN 2 ELSE 3 END
FROM public.sorteos_rifa s
JOIN public.planes p ON p.id IN ('esencial', 'selecto', 'elite')
WHERE s.slug = 'fz-noviembre'
  AND NOT EXISTS (
    SELECT 1 FROM public.sorteo_planes sp WHERE sp.sorteo_id = s.id
  );

-- Solo el número de noviembre (537). Agosto y octubre no se tocan.
UPDATE public.claves c
SET sorteo_id = s.id
FROM public.sorteos_rifa s
WHERE s.slug = 'fz-noviembre'
  AND c.periodo = '2026-11'
  AND c.sorteo_id IS NULL;

UPDATE public.membresias m
SET sorteo_id = c.sorteo_id
FROM public.claves c
WHERE c.membresia_id = m.id
  AND c.sorteo_id IS NOT NULL
  AND m.sorteo_id IS NULL;

UPDATE public.sorteos_beneficio b
SET sorteo_id = s.id
FROM public.sorteos_rifa s
WHERE s.slug = 'fz-noviembre'
  AND b.fecha_sorteo >= DATE '2026-11-01'
  AND b.fecha_sorteo < DATE '2026-12-01'
  AND b.sorteo_id IS NULL;

ALTER TABLE public.sorteos_rifa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_planes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sorteos_rifa_staff ON public.sorteos_rifa;
CREATE POLICY sorteos_rifa_staff ON public.sorteos_rifa
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sorteo_planes_staff ON public.sorteo_planes;
CREATE POLICY sorteo_planes_staff ON public.sorteo_planes
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
