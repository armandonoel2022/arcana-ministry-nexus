-- Corregir las fechas de nacimiento que tienen un día de desfase
-- debido a la interpretación UTC/zona horaria
-- Esto agrega un día a todas las fechas de nacimiento existentes

UPDATE members 
SET fecha_nacimiento = fecha_nacimiento + INTERVAL '1 day'
WHERE fecha_nacimiento IS NOT NULL;