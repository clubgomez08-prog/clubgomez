-- Fecha de nacimiento + control de felicitación anual

ALTER TABLE public.miembros
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

ALTER TABLE public.miembros
  ADD COLUMN IF NOT EXISTS cumpleanos_email_anio INTEGER;

COMMENT ON COLUMN public.miembros.fecha_nacimiento IS
  'Fecha de nacimiento del miembro (para felicitación anual).';

COMMENT ON COLUMN public.miembros.cumpleanos_email_anio IS
  'Año en que se envió el último correo de cumpleaños (evita duplicados).';

CREATE INDEX IF NOT EXISTS idx_miembros_cumpleanos_md
  ON public.miembros (
    extract(month from fecha_nacimiento),
    extract(day from fecha_nacimiento)
  )
  WHERE fecha_nacimiento IS NOT NULL;
