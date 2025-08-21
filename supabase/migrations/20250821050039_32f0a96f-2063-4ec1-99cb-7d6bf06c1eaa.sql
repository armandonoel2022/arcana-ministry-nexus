-- Corregir fechas de nacimiento agregando un día a todas las fechas
-- Esto corrige el problema de que las fechas estaban un día atrasadas

UPDATE members 
SET fecha_nacimiento = fecha_nacimiento + INTERVAL '1 day'
WHERE fecha_nacimiento IS NOT NULL;