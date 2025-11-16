-- ============================================
-- MIGRACIÓN: Arreglar acceso al chat para todos los usuarios
-- ============================================

-- 1. Eliminar políticas RLS conflictivas de chat_messages
DROP POLICY IF EXISTS "Anyone can view all chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view bot messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "ARCANA bot can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can update their messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;

-- 2. Crear función helper para verificar membresía en sala
CREATE OR REPLACE FUNCTION public.is_member_of_room(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.chat_room_members 
    WHERE user_id = _user_id AND room_id = _room_id
  );
$$;

-- 3. Crear políticas RLS simplificadas y claras para chat_messages
-- Los miembros de una sala pueden ver TODOS los mensajes (usuarios y bot)
CREATE POLICY "Members can view all messages in their rooms"
ON public.chat_messages
FOR SELECT
USING (
  public.is_member_of_room(auth.uid(), room_id)
);

-- Los usuarios autenticados pueden enviar mensajes (trigger auto-join maneja membresía)
CREATE POLICY "Authenticated users can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
  OR 
  (user_id IS NULL) -- Permitir mensajes del bot
);

-- Los usuarios pueden actualizar solo sus propios mensajes
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar solo sus propios mensajes
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Asegurar que el trigger de auto-join existe y funciona
CREATE OR REPLACE FUNCTION public.auto_join_chat_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_auto_join_chat_room ON public.chat_messages;
CREATE TRIGGER trigger_auto_join_chat_room
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_chat_room();

-- 5. Agregar índice para mejorar rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_chat_room_members_lookup 
ON public.chat_room_members(user_id, room_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
ON public.chat_messages(room_id, created_at DESC);

-- 6. Habilitar realtime para user_buzzes
ALTER TABLE public.user_buzzes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_buzzes;