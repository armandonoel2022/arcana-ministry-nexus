-- Agregar a Yindia Carolina Santana Castillo al Grupo de Keyla
-- (El nombre en la base de datos es Yindia, no Yindhia)

INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Keyla'),
  (SELECT id FROM members WHERE nombres = 'Yindia Carolina' AND apellidos = 'Santana Castillo'),
  'vocals', false, true, 1, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 1;

-- Actualizar su voz
UPDATE members 
SET voz_instrumento = 'Soprano' 
WHERE nombres = 'Yindia Carolina' AND apellidos = 'Santana Castillo';