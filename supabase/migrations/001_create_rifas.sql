-- Tabla rifas para verificar conexión
CREATE TABLE IF NOT EXISTS rifas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio INTEGER NOT NULL DEFAULT 1000,
  cantidad_total INTEGER NOT NULL DEFAULT 100,
  descripcion TEXT,
  fecha_sorteo TIMESTAMPTZ,
  estado TEXT DEFAULT 'activa',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
