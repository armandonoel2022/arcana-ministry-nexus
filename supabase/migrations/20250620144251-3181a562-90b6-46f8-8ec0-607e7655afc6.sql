
-- Crear políticas RLS para permitir que ARCANA bot envíe mensajes
CREATE POLICY "Anyone can view chat messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política especial para permitir que ARCANA bot envíe mensajes
CREATE POLICY "ARCANA bot can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

-- Política para actualizar mensajes (para usuarios autenticados)
CREATE POLICY "Authenticated users can update their messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Política para eliminar mensajes (solo el autor o usuarios autenticados)
CREATE POLICY "Users can delete their own messages" 
  ON public.chat_messages 
  FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);
