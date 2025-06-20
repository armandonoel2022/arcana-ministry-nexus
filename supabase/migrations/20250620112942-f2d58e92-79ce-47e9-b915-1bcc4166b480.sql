
-- Actualizar todas las fechas de servicios que tienen año 1925 para cambiarlas a 2025
UPDATE public.services 
SET service_date = service_date + INTERVAL '100 years'
WHERE EXTRACT(YEAR FROM service_date) = 1925;
