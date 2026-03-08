-- Tabla de sorteos realizados
CREATE TABLE IF NOT EXISTS sorteos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rifa_id UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  numero_boleto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_sorteos_rifa_id ON sorteos(rifa_id);
CREATE INDEX IF NOT EXISTS idx_sorteos_created_at ON sorteos(created_at DESC);
