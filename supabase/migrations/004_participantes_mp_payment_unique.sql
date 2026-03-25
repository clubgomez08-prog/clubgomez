-- Un mismo pago de Mercado Pago no debe poder asociarse a dos participantes distintos.
CREATE UNIQUE INDEX IF NOT EXISTS idx_participantes_mp_payment_id_unique
ON participantes (mp_payment_id)
WHERE mp_payment_id IS NOT NULL AND btrim(mp_payment_id) <> '';
