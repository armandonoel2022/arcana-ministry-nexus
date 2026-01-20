-- Eliminar todos los servicios de 2027 en adelante
DELETE FROM public.services WHERE service_date >= '2027-01-01';