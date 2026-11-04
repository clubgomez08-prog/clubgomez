-- Lo que se ve en la tarjeta del plan: cinta, precio tachado, texto de arriba, /mes y botón.
-- No toca ventas ni números.

ALTER TABLE public.sorteo_planes
  ADD COLUMN IF NOT EXISTS precio_antes INTEGER,
  ADD COLUMN IF NOT EXISTS recomendado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etiqueta TEXT,
  ADD COLUMN IF NOT EXISTS precio_sufijo TEXT,
  ADD COLUMN IF NOT EXISTS boton TEXT;

-- El primer plan de cada sorteo ya salía como recomendado. Se deja igual.
UPDATE public.sorteo_planes AS sp
SET recomendado = true
WHERE sp.activo IS DISTINCT FROM false
  AND sp.orden = (
    SELECT MIN(x.orden)
    FROM public.sorteo_planes AS x
    WHERE x.sorteo_id = sp.sorteo_id
      AND x.activo IS DISTINCT FROM false
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.sorteo_planes AS y
    WHERE y.sorteo_id = sp.sorteo_id
      AND y.recomendado = true
  );
