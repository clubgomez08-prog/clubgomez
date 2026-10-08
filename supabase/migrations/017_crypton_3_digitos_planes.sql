-- Crypton: claves de 3 dígitos + precios/oportunidades nuevos
-- Pegar en Supabase → SQL Editor → Run
--
-- Físico 000–700 · Web 701–999
-- Élite 6 / 100.000 · Selecto 3 / 50.000 · Esencial 1 / 20.000

-- ---------------------------------------------------------------------------
-- 1) Ver qué hay ahora (no cambia nada)
-- ---------------------------------------------------------------------------
-- SELECT periodo, length(numero) AS digitos, count(*)
-- FROM public.claves
-- GROUP BY 1, 2
-- ORDER BY 1 DESC, 2;

-- SELECT id, nombre, precio_cop, claves FROM public.planes ORDER BY precio_cop DESC;

-- ---------------------------------------------------------------------------
-- 2) Planes (precios y oportunidades)
-- ---------------------------------------------------------------------------
UPDATE public.planes SET
  precio_cop = 100000,
  claves = 6,
  tag = 'Vives la mejor versión del Club',
  nombre = 'Élite'
WHERE id = 'elite';

UPDATE public.planes SET
  precio_cop = 50000,
  claves = 3,
  tag = 'Vas en serio con el Club',
  nombre = 'Selecto'
WHERE id = 'selecto';

UPDATE public.planes SET
  precio_cop = 20000,
  claves = 1,
  tag = 'Arrancas con el Club',
  nombre = 'Esencial'
WHERE id = 'esencial';

-- ---------------------------------------------------------------------------
-- 3) Permitir 3 dígitos (quita el CHECK de 4)
-- ---------------------------------------------------------------------------
ALTER TABLE public.claves
  DROP CONSTRAINT IF EXISTS claves_numero_formato;

-- Si ESTE mes ya hay claves de 4 dígitos vendidas de verdad, NO corras el
-- bloque 4. Deja este CHECK (3 o 4 dígitos) y listo.
ALTER TABLE public.claves
  ADD CONSTRAINT claves_numero_formato
  CHECK (numero ~ '^[0-9]{3,4}$');

-- ---------------------------------------------------------------------------
-- 4) OPCIONAL — solo si este periodo es de prueba / vacío
--    Pasa las claves a los 3 últimos dígitos y deja el CHECK en 3.
-- ---------------------------------------------------------------------------
-- UPDATE public.claves
-- SET numero = lpad(right(regexp_replace(numero, '[^0-9]', '', 'g'), 3), 3, '0')
-- WHERE numero IS NOT NULL;
--
-- DELETE FROM public.claves a
-- USING public.claves b
-- WHERE a.periodo = b.periodo
--   AND a.numero = b.numero
--   AND a.id <> b.id
--   AND a.created_at > b.created_at;
--
-- ALTER TABLE public.claves DROP CONSTRAINT IF EXISTS claves_numero_formato;
-- ALTER TABLE public.claves
--   ADD CONSTRAINT claves_numero_formato
--   CHECK (numero ~ '^[0-9]{3}$');

-- ---------------------------------------------------------------------------
-- 5) Verificar
-- ---------------------------------------------------------------------------
-- SELECT id, nombre, precio_cop, claves FROM public.planes ORDER BY precio_cop DESC;
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.claves'::regclass
--   AND conname = 'claves_numero_formato';
