-- Cambiar servicios de miércoles post-cuarentena de "cuarentena" a "Servicio de Miércoles"
UPDATE public.services SET service_type = 'Servicio de Miércoles' WHERE service_type = 'cuarentena' AND service_date >= '2026-02-23';

-- Corregir los servicios del 1 de marzo que tienen tipo "regular" a "Servicio Dominical"
UPDATE public.services SET service_type = 'Servicio Dominical' WHERE service_date::date = '2026-03-01' AND service_type = 'regular';