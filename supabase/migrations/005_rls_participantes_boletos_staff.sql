-- =============================================================================
-- Seguridad: cerrar lectura pública (anon) en participantes y boletos,
-- mantener acceso para staff autenticado (panel admin con JWT) e índice MP.
--
-- Orden recomendado:
-- 1) Desplegar código con POST /api/registro-participante y POST /api/mis-tickets/buscar
-- 2) Ejecutar este script en Supabase SQL Editor
-- 3) INSERT en public.app_staff (user_id) con el UUID de cada admin (auth.users)
-- =============================================================================

ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- 1) Índice único: un mismo pago MP no puede asociarse a dos participantes
DROP INDEX IF EXISTS idx_participantes_mp_payment_id_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_participantes_mp_payment_unique
ON public.participantes (mp_payment_id)
WHERE mp_payment_id IS NOT NULL AND btrim(mp_payment_id) <> '';

-- 2) Quitar policies abiertas a anon (ajusta el nombre si en tu proyecto difiere)
DROP POLICY IF EXISTS participantes_public_read ON public.participantes;
DROP POLICY IF EXISTS boletos_public_read ON public.boletos;

-- Tabla de operadores del panel (UUID = auth.users.id)
CREATE TABLE IF NOT EXISTS public.app_staff (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_staff ENABLE ROW LEVEL SECURITY;

-- Solo staff puede ver la tabla de staff (evita enumeración a usuarios normales)
DROP POLICY IF EXISTS app_staff_select_self ON public.app_staff;
CREATE POLICY app_staff_select_self
  ON public.app_staff
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.app_staff IS 'Usuarios que pueden leer participantes/boletos desde el cliente admin (JWT). Insertar filas manualmente con el UUID de auth.users.';

-- Función: ¿el JWT actual es staff?
CREATE OR REPLACE FUNCTION public.is_app_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_staff s
    WHERE s.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_app_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_staff() TO authenticated;

-- Políticas: solo staff autenticado lee/escribe participantes y boletos vía PostgREST
DROP POLICY IF EXISTS participantes_staff_select ON public.participantes;
CREATE POLICY participantes_staff_select
  ON public.participantes
  FOR SELECT
  TO authenticated
  USING (public.is_app_staff());

DROP POLICY IF EXISTS participantes_staff_insert ON public.participantes;
CREATE POLICY participantes_staff_insert
  ON public.participantes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS participantes_staff_update ON public.participantes;
CREATE POLICY participantes_staff_update
  ON public.participantes
  FOR UPDATE
  TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS participantes_staff_delete ON public.participantes;
CREATE POLICY participantes_staff_delete
  ON public.participantes
  FOR DELETE
  TO authenticated
  USING (public.is_app_staff());

DROP POLICY IF EXISTS boletos_staff_select ON public.boletos;
CREATE POLICY boletos_staff_select
  ON public.boletos
  FOR SELECT
  TO authenticated
  USING (public.is_app_staff());

DROP POLICY IF EXISTS boletos_staff_insert ON public.boletos;
CREATE POLICY boletos_staff_insert
  ON public.boletos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS boletos_staff_update ON public.boletos;
CREATE POLICY boletos_staff_update
  ON public.boletos
  FOR UPDATE
  TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS boletos_staff_delete ON public.boletos;
CREATE POLICY boletos_staff_delete
  ON public.boletos
  FOR DELETE
  TO authenticated
  USING (public.is_app_staff());

-- anon: sin políticas explícitas en participantes/boletos => denegado por RLS
-- (el service role del backend no usa RLS)
