-- Registro de miembros sin membresía: cédula opcional + lectura propia
-- Ejecutar en Supabase → SQL Editor → Run

ALTER TABLE public.miembros
  ALTER COLUMN cedula DROP NOT NULL;

DROP INDEX IF EXISTS idx_miembros_cedula;

CREATE UNIQUE INDEX IF NOT EXISTS idx_miembros_cedula
  ON public.miembros (cedula)
  WHERE cedula IS NOT NULL AND btrim(cedula) <> '';

-- El miembro autenticado puede leer su propio perfil
DROP POLICY IF EXISTS miembros_select_own ON public.miembros;
CREATE POLICY miembros_select_own
  ON public.miembros FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS miembros_update_own ON public.miembros;
CREATE POLICY miembros_update_own
  ON public.miembros FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Lectura de membresías / claves propias (portal)
DROP POLICY IF EXISTS membresias_select_own ON public.membresias;
CREATE POLICY membresias_select_own
  ON public.membresias FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.miembros m
      WHERE m.id = miembro_id AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS claves_select_own ON public.claves;
CREATE POLICY claves_select_own
  ON public.claves FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.membresias mb
      JOIN public.miembros m ON m.id = mb.miembro_id
      WHERE mb.id = membresia_id AND m.auth_user_id = auth.uid()
    )
  );
