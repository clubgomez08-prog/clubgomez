-- Índice único para evitar duplicados de número de boleto por rifa
-- Protege contra condiciones de carrera en asignación simultánea
CREATE UNIQUE INDEX IF NOT EXISTS idx_boletos_rifa_numero 
ON boletos(rifa_id, numero);
