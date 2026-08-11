-- Club Gómez: pool de claves 0000-9999 únicas por periodo + fechas de premio (Motilón)

-- ---------------------------------------------------------------------------
-- Normalizar números a 4 dígitos
-- ---------------------------------------------------------------------------
UPDATE public.claves
SET numero = lpad(regexp_replace(numero, '[^0-9]', '', 'g'), 4, '0')
WHERE numero IS NOT NULL
  AND length(regexp_replace(coalesce(numero, ''), '[^0-9]', '', 'g')) BETWEEN 1 AND 4;

-- Eliminar duplicados (periodo, numero) conservando la más antigua
DELETE FROM public.claves a
USING public.claves b
WHERE a.periodo = b.periodo
  AND a.numero = b.numero
  AND a.id <> b.id
  AND a.created_at > b.created_at;

-- Quitar unicidad por membresía; unicidad global por periodo
ALTER TABLE public.claves
  DROP CONSTRAINT IF EXISTS claves_membresia_id_numero_periodo_key;

DROP INDEX IF EXISTS claves_membresia_id_numero_periodo_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_claves_periodo_numero_unique
  ON public.claves (periodo, numero);

ALTER TABLE public.claves
  DROP CONSTRAINT IF EXISTS claves_numero_formato;

ALTER TABLE public.claves
  ADD CONSTRAINT claves_numero_formato
  CHECK (numero ~ '^[0-9]{4}$');

-- ---------------------------------------------------------------------------
-- Fechas de premio / Motilón (Daniel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sorteos_beneficio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  fecha_sorteo DATE NOT NULL,
  premio TEXT NOT NULL,
  descripcion TEXT,
  loteria TEXT NOT NULL DEFAULT 'Motilón Noche',
  estado TEXT NOT NULL DEFAULT 'programado'
    CHECK (estado IN ('programado', 'jugado', 'entregado', 'sin_ganador')),
  resultado TEXT
    CHECK (resultado IS NULL OR resultado ~ '^[0-9]{4}$'),
  ganador_clave_id UUID REFERENCES public.claves (id) ON DELETE SET NULL,
  ganador_miembro_id UUID REFERENCES public.miembros (id) ON DELETE SET NULL,
  jugado_en TIMESTAMPTZ,
  entregado_en TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sorteos_beneficio_periodo
  ON public.sorteos_beneficio (periodo);

CREATE INDEX IF NOT EXISTS idx_sorteos_beneficio_fecha
  ON public.sorteos_beneficio (fecha_sorteo);

CREATE INDEX IF NOT EXISTS idx_sorteos_beneficio_estado
  ON public.sorteos_beneficio (estado);

ALTER TABLE public.sorteos_beneficio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sorteos_beneficio_staff_all ON public.sorteos_beneficio;
CREATE POLICY sorteos_beneficio_staff_all
  ON public.sorteos_beneficio FOR ALL TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());
