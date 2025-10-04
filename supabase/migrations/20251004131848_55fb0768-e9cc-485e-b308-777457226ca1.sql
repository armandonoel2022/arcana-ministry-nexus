-- Revertir el cambio previo y corregir el desfase original
-- Restar 2 días a todas las fechas de nacimiento para volver a la fecha real
UPDATE members
SET fecha_nacimiento = fecha_nacimiento - INTERVAL '2 day'
WHERE fecha_nacimiento IS NOT NULL;