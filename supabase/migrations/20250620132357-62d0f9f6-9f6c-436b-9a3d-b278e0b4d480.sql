
-- Eliminar las políticas existentes que causan recursión infinita
DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can view chat rooms they are members of" ON public.chat_rooms;

-- Crear nuevas políticas sin recursión
CREATE POLICY "Users can view all active chat rooms" ON public.chat_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view all room members" ON public.chat_room_members
  FOR SELECT USING (true);

-- Agregar todos los miembros existentes a la sala general
INSERT INTO public.chat_room_members (room_id, user_id)
SELECT 
  (SELECT id FROM public.chat_rooms WHERE name = 'Sala General' LIMIT 1),
  p.id
FROM public.profiles p
WHERE p.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.chat_room_members crm 
  WHERE crm.room_id = (SELECT id FROM public.chat_rooms WHERE name = 'Sala General' LIMIT 1)
  AND crm.user_id = p.id
);
