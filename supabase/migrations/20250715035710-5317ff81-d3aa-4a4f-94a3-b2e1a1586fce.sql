-- Primero, limpiar las políticas RLS de chat_messages y simplificarlas
DROP POLICY IF EXISTS "Users can insert messages in rooms they belong to" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in rooms they belong to" ON public.chat_messages;

-- Crear política simplificada para ver todos los mensajes
CREATE POLICY "Anyone can view all chat messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (true);

-- Política simplificada para enviar mensajes
CREATE POLICY "Anyone can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Crear función para agregar automáticamente usuarios a salas de chat cuando envían un mensaje
CREATE OR REPLACE FUNCTION auto_join_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si es un mensaje de usuario (no bot)
  IF NEW.user_id IS NOT NULL THEN
    -- Verificar si el usuario ya es miembro de la sala
    IF NOT EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE user_id = NEW.user_id AND room_id = NEW.room_id
    ) THEN
      -- Agregar al usuario como miembro de la sala
      INSERT INTO chat_room_members (room_id, user_id, role)
      VALUES (NEW.room_id, NEW.user_id, 'member')
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para auto-agregar usuarios a salas
DROP TRIGGER IF EXISTS auto_join_chat_room_trigger ON chat_messages;
CREATE TRIGGER auto_join_chat_room_trigger
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_chat_room();

-- Asegurar que hay al menos una sala de chat disponible
INSERT INTO chat_rooms (id, name, description, room_type, is_active, is_moderated)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Chat General del Ministerio',
  'Sala principal para comunicación del Ministerio ADN',
  'general',
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Agregar constraint unique para evitar duplicados en chat_room_members
ALTER TABLE chat_room_members 
DROP CONSTRAINT IF EXISTS unique_room_user;

ALTER TABLE chat_room_members 
ADD CONSTRAINT unique_room_user UNIQUE (room_id, user_id);