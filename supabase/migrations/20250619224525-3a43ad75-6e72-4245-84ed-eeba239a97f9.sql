
-- Verificar que existen datos en la tabla services
SELECT 
  COUNT(*) as total_services,
  MIN(service_date) as first_service,
  MAX(service_date) as last_service,
  COUNT(DISTINCT EXTRACT(MONTH FROM service_date)) as months_with_services
FROM public.services;

-- Ver algunos ejemplos de los datos guardados
SELECT 
  service_date,
  title,
  leader,
  service_type,
  location,
  is_confirmed
FROM public.services 
ORDER BY service_date 
LIMIT 10;
