
-- Primero eliminar las salas existentes para empezar limpio
DELETE FROM public.chat_room_members;
DELETE FROM public.chat_rooms;

-- Insertar las nuevas salas de chat con los nombres específicos
INSERT INTO public.chat_rooms (name, description, room_type, is_moderated) VALUES
('Sala General', 'Comunicación general del ministerio', 'general', false),
('Sala de Músicos', 'Coordinación para músicos del ministerio', 'department', true),
('Sala de Danza', 'Coordinación para el grupo de danza', 'department', true),
('Sala de Directiva', 'Comunicación de la directiva del ministerio', 'department', true),
('Sala de Multimedia', 'Coordinación del equipo de multimedia', 'department', true),
('Sala de Logística Piso', 'Comunicación del equipo de logística de piso', 'department', true),
('Sala de Teatro', 'Coordinación para el grupo de teatro', 'department', true),
('Sala Grupo de Aleida', 'Comunicación del grupo de alabanza de Aleida', 'department', true),
('Sala Grupo de Massy', 'Comunicación del grupo de alabanza de Massy', 'department', true),
('Sala Grupo de Keyla', 'Comunicación del grupo de alabanza de Keyla', 'department', true);

-- Agregar todos los miembros activos a la Sala General
INSERT INTO public.chat_room_members (room_id, user_id)
SELECT 
  (SELECT id FROM public.chat_rooms WHERE name = 'Sala General' LIMIT 1),
  p.id
FROM public.profiles p
WHERE p.is_active = true;
