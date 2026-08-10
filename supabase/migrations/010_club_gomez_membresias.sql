-- Club Gómez: esquema de membresías (proyecto nuevo)
-- Ejecutar en Supabase → SQL Editor → Run

-- ---------------------------------------------------------------------------
-- Planes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio_cop INTEGER NOT NULL CHECK (precio_cop > 0),
  claves INTEGER NOT NULL CHECK (claves > 0),
  tag TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.planes (id, nombre, precio_cop, claves, tag)
VALUES
  ('elite', 'Élite', 90000, 10, 'Vives la mejor versión del Club'),
  ('selecto', 'Selecto', 60000, 7, 'Vas en serio con el Club'),
  ('esencial', 'Esencial', 30000, 3, 'Arrancas con el Club')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  precio_cop = EXCLUDED.precio_cop,
  claves = EXCLUDED.claves,
  tag = EXCLUDED.tag;

-- ---------------------------------------------------------------------------
-- Miembros
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.miembros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cedula TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ciudad TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'activo', 'vencido', 'cancelado')),
  auth_user_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_miembros_email_lower
  ON public.miembros (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_miembros_cedula
  ON public.miembros (cedula);

CREATE INDEX IF NOT EXISTS idx_miembros_estado
  ON public.miembros (estado);

-- ---------------------------------------------------------------------------
-- Membresías (ciclos de suscripción)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membresias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id UUID NOT NULL REFERENCES public.miembros (id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.planes (id),
  estado TEXT NOT NULL DEFAULT 'pendiente_pago'
    CHECK (estado IN ('pendiente_pago', 'activa', 'vencida', 'cancelada')),
  inicia_en TIMESTAMPTZ,
  vence_en TIMESTAMPTZ,
  origen TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (origen IN ('whatsapp', 'wompi', 'manual', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membresias_miembro
  ON public.membresias (miembro_id);

CREATE INDEX IF NOT EXISTS idx_membresias_estado
  ON public.membresias (estado);

-- ---------------------------------------------------------------------------
-- Claves (oportunidades asignadas por ciclo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membresia_id UUID NOT NULL REFERENCES public.membresias (id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  periodo TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membresia_id, numero, periodo)
);

CREATE INDEX IF NOT EXISTS idx_claves_membresia
  ON public.claves (membresia_id);

CREATE INDEX IF NOT EXISTS idx_claves_periodo
  ON public.claves (periodo);

-- ---------------------------------------------------------------------------
-- Pagos (Wompi / manual)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membresia_id UUID NOT NULL REFERENCES public.membresias (id) ON DELETE CASCADE,
  miembro_id UUID NOT NULL REFERENCES public.miembros (id) ON DELETE CASCADE,
  monto_cop INTEGER NOT NULL CHECK (monto_cop > 0),
  moneda TEXT NOT NULL DEFAULT 'COP',
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'anulado')),
  metodo TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (metodo IN ('pendiente', 'wompi', 'transferencia', 'efectivo', 'otro')),
  wompi_transaction_id TEXT,
  wompi_reference TEXT,
  raw JSONB,
  pagado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_wompi_transaction
  ON public.pagos (wompi_transaction_id)
  WHERE wompi_transaction_id IS NOT NULL AND btrim(wompi_transaction_id) <> '';

CREATE INDEX IF NOT EXISTS idx_pagos_membresia
  ON public.pagos (membresia_id);

CREATE INDEX IF NOT EXISTS idx_pagos_estado
  ON public.pagos (estado);

-- ---------------------------------------------------------------------------
-- Solicitudes desde formulario (antes de activar)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solicitudes_membresia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL REFERENCES public.planes (id),
  nombre TEXT NOT NULL,
  cedula TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ciudad TEXT,
  estado TEXT NOT NULL DEFAULT 'nueva'
    CHECK (estado IN ('nueva', 'contactada', 'convertida', 'descartada')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado
  ON public.solicitudes_membresia (estado);

CREATE INDEX IF NOT EXISTS idx_solicitudes_created
  ON public.solicitudes_membresia (created_at DESC);

-- ---------------------------------------------------------------------------
-- Staff del panel (UUID = auth.users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_staff (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS básico: cerrado al público; API usa service_role
-- ---------------------------------------------------------------------------
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_membresia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_staff ENABLE ROW LEVEL SECURITY;

-- Lectura pública de planes activos (landing)
DROP POLICY IF EXISTS planes_public_select ON public.planes;
CREATE POLICY planes_public_select
  ON public.planes
  FOR SELECT
  TO anon, authenticated
  USING (activo = true);

-- Staff autenticado puede leer/gestionar (cuando exista JWT de admin)
CREATE OR REPLACE FUNCTION public.is_app_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_staff s WHERE s.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_app_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_staff() TO authenticated;

DROP POLICY IF EXISTS miembros_staff_all ON public.miembros;
CREATE POLICY miembros_staff_all
  ON public.miembros FOR ALL TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS membresias_staff_all ON public.membresias;
CREATE POLICY membresias_staff_all
  ON public.membresias FOR ALL TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS claves_staff_all ON public.claves;
CREATE POLICY claves_staff_all
  ON public.claves FOR ALL TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS pagos_staff_all ON public.pagos;
CREATE POLICY pagos_staff_all
  ON public.pagos FOR ALL TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS solicitudes_staff_all ON public.solicitudes_membresia;
CREATE POLICY solicitudes_staff_all
  ON public.solicitudes_membresia FOR ALL TO authenticated
  USING (public.is_app_staff())
  WITH CHECK (public.is_app_staff());

DROP POLICY IF EXISTS app_staff_select_self ON public.app_staff;
CREATE POLICY app_staff_select_self
  ON public.app_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid());
