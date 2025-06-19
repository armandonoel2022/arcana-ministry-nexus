
-- Primero vamos a ver los grupos actuales
SELECT id, name FROM public.worship_groups ORDER BY name;

-- Ver los servicios actuales y sus grupos asignados
SELECT 
  s.title,
  s.service_date,
  s.leader,
  wg.name as grupo_asignado
FROM public.services s
LEFT JOIN public.worship_groups wg ON s.assigned_group_id = wg.id
ORDER BY s.service_date
LIMIT 10;

-- Actualizar o insertar los grupos correctos
INSERT INTO public.worship_groups (name, description, color_theme) 
VALUES 
  ('Grupo de Aleida', 'Grupo de adoración dirigido por Aleida', '#E11D48'),
  ('Grupo de Massy', 'Grupo de adoración dirigido por Massy', '#059669'),
  ('Grupo de Keyla', 'Grupo de adoración dirigido por Keyla', '#7C3AED')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  color_theme = EXCLUDED.color_theme;

-- Desactivar los grupos genéricos antiguos si existen
UPDATE public.worship_groups 
SET is_active = false 
WHERE name IN ('Grupo Alpha', 'Grupo Beta', 'Grupo Gamma', 'Grupo Delta');
