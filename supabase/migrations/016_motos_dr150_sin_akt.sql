-- Octubre 2026: quitar marca AKT y reemplazar NKD 125 por DR 150
UPDATE public.sorteos_beneficio
SET
  premio = 'Motocicleta Special 110 X',
  descripcion = 'Homepage · moto-110',
  imagen_key = 'beneficio-moto-110'
WHERE periodo = '2026-10' AND slug = 'moto-110';

UPDATE public.sorteos_beneficio
SET
  premio = 'Motocicleta DR 150',
  slug = 'moto-150',
  imagen_key = 'beneficio-moto-150',
  descripcion = 'Homepage · moto-150'
WHERE periodo = '2026-10' AND slug = 'moto-125';

-- Por si quedó el nombre viejo sin slug
UPDATE public.sorteos_beneficio
SET premio = replace(premio, ' AKT ', ' ')
WHERE periodo = '2026-10' AND premio ILIKE '%AKT%';

UPDATE public.sorteos_beneficio
SET premio = replace(premio, 'AKT ', '')
WHERE periodo = '2026-10' AND premio ILIKE 'AKT %';
