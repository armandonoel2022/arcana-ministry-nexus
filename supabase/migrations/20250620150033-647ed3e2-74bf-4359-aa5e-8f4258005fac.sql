
-- Permitir valores null en la columna user_id para mensajes del bot
ALTER TABLE public.chat_messages ALTER COLUMN user_id DROP NOT NULL;

-- Actualizar las políticas RLS para permitir mensajes con user_id null (bot messages)
DROP POLICY IF EXISTS "ARCANA bot can send messages" ON public.chat_messages;

CREATE POLICY "ARCANA bot can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    user_id IS NULL OR  -- Allow bot messages with null user_id
    auth.uid() IS NOT NULL  -- Allow authenticated users
  );

-- También necesitamos una política para que todos puedan leer mensajes de bot
DROP POLICY IF EXISTS "Anyone can view bot messages" ON public.chat_messages;

CREATE POLICY "Anyone can view bot messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    user_id IS NULL OR  -- Allow reading bot messages
    auth.uid() IS NOT NULL  -- Allow authenticated users to read all messages
  );
