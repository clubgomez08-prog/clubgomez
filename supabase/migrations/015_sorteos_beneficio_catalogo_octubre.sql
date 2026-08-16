-- Club Gómez: alinear fechas de premio (panel) con homepage
-- Columnas de catálogo + seed octubre 2026

ALTER TABLE public.sorteos_beneficio
  ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.sorteos_beneficio
  ADD COLUMN IF NOT EXISTS imagen_key TEXT;

ALTER TABLE public.sorteos_beneficio
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sorteos_beneficio_periodo_fecha_slug
  ON public.sorteos_beneficio (periodo, fecha_sorteo, slug)
  WHERE slug IS NOT NULL;

-- Seed octubre 2026 (solo si no existe esa fecha+slug)
INSERT INTO public.sorteos_beneficio
  (periodo, fecha_sorteo, premio, descripcion, slug, imagen_key, destacado, loteria, estado)
SELECT v.periodo, v.fecha_sorteo::date, v.premio, v.descripcion, v.slug, v.imagen_key, v.destacado, v.loteria, v.estado
FROM (VALUES
  ('2026-10', '2026-10-06', 'Nevera MABE No Frost Congelador Superior 297 Litros', 'Homepage · nevera', 'nevera', 'beneficio-nevera', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-22', 'Nevera MABE No Frost Congelador Superior 297 Litros', 'Homepage · nevera', 'nevera', 'beneficio-nevera', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-07', 'Estufa de Piso MABE 4 Puestos Gas Natural', 'Homepage · estufa', 'estufa', 'beneficio-estufa', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-15', 'Estufa de Piso MABE 4 Puestos Gas Natural', 'Homepage · estufa', 'estufa', 'beneficio-estufa', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-28', 'Estufa de Piso MABE 4 Puestos Gas Natural', 'Homepage · estufa', 'estufa', 'beneficio-estufa', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-08', 'Lavadora KALLEY Carga Superior 12 Kilos', 'Homepage · lavadora', 'lavadora', 'beneficio-lavadora', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-20', 'Lavadora KALLEY Carga Superior 12 Kilos', 'Homepage · lavadora', 'lavadora', 'beneficio-lavadora', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-30', 'Lavadora KALLEY Carga Superior 12 Kilos', 'Homepage · lavadora', 'lavadora', 'beneficio-lavadora', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-09', 'Bicicleta Profit Jasper Rin 29', 'Homepage · bici', 'bici', 'beneficio-bici', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-16', 'Bicicleta Profit Jasper Rin 29', 'Homepage · bici', 'bici', 'beneficio-bici', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-24', 'Bicicleta Profit Jasper Rin 29', 'Homepage · bici', 'bici', 'beneficio-bici', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-10', 'Parlante KALLEY K-SPK300D Negro', 'Homepage · parlante', 'parlante', 'beneficio-parlante', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-22', 'Parlante KALLEY K-SPK300D Negro', 'Homepage · parlante', 'parlante', 'beneficio-parlante', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-29', 'Parlante KALLEY K-SPK300D Negro', 'Homepage · parlante', 'parlante', 'beneficio-parlante', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-14', 'TV KALLEY 50" 4K-UHD Smart TV', 'Homepage · tv', 'tv', 'beneficio-tv', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-21', 'TV KALLEY 50" 4K-UHD Smart TV', 'Homepage · tv', 'tv', 'beneficio-tv', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-13', 'Portátil LENOVO IdeaPad Slim 3 15.3" i5 / 8GB / 512GB', 'Homepage · laptop', 'laptop', 'beneficio-laptop', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-24', 'Portátil LENOVO IdeaPad Slim 3 15.3" i5 / 8GB / 512GB', 'Homepage · laptop', 'laptop', 'beneficio-laptop', false, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-17', 'Motocicleta Special 110 X', 'Homepage · moto-110', 'moto-110', 'beneficio-moto-110', true, 'Motilón Noche', 'programado'),
  ('2026-10', '2026-10-31', 'Motocicleta DR 150', 'Homepage · moto-150', 'moto-150', 'beneficio-moto-150', true, 'Motilón Noche', 'programado')
) AS v(periodo, fecha_sorteo, premio, descripcion, slug, imagen_key, destacado, loteria, estado)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.sorteos_beneficio s
  WHERE s.periodo = v.periodo
    AND s.fecha_sorteo = v.fecha_sorteo::date
    AND s.slug = v.slug
);
