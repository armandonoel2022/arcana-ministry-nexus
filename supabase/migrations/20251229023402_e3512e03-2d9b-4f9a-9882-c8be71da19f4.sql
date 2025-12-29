-- Tabla para chats privados (Direct Messages)
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'voice')),
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_dm_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_dm_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_dm_created ON public.direct_messages(created_at DESC);
CREATE INDEX idx_dm_conversation ON public.direct_messages(sender_id, receiver_id, created_at DESC);

-- Vista para obtener conversaciones con último mensaje
CREATE OR REPLACE VIEW public.dm_conversations AS
SELECT DISTINCT ON (conversation_partner)
  dm.id,
  CASE 
    WHEN dm.sender_id = auth.uid() THEN dm.receiver_id 
    ELSE dm.sender_id 
  END as conversation_partner,
  dm.message as last_message,
  dm.created_at as last_message_at,
  dm.is_read,
  p.full_name as partner_name,
  p.photo_url as partner_photo,
  (SELECT COUNT(*) FROM public.direct_messages 
   WHERE receiver_id = auth.uid() 
   AND sender_id = CASE WHEN dm.sender_id = auth.uid() THEN dm.receiver_id ELSE dm.sender_id END
   AND is_read = false
  ) as unread_count
FROM public.direct_messages dm
JOIN public.profiles p ON p.id = CASE 
  WHEN dm.sender_id = auth.uid() THEN dm.receiver_id 
  ELSE dm.sender_id 
END
WHERE dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid()
ORDER BY conversation_partner, dm.created_at DESC;

-- Tabla para contactos frecuentes (basado en interacciones)
CREATE TABLE public.frequent_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_count INTEGER DEFAULT 1,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

CREATE INDEX idx_frequent_contacts_user ON public.frequent_contacts(user_id, interaction_count DESC);

-- Función para actualizar contactos frecuentes
CREATE OR REPLACE FUNCTION public.update_frequent_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar o insertar contacto frecuente para el sender
  INSERT INTO public.frequent_contacts (user_id, contact_id, interaction_count, last_interaction_at)
  VALUES (NEW.sender_id, NEW.receiver_id, 1, now())
  ON CONFLICT (user_id, contact_id) 
  DO UPDATE SET 
    interaction_count = frequent_contacts.interaction_count + 1,
    last_interaction_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar contactos frecuentes al enviar mensaje
CREATE TRIGGER on_dm_sent
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_frequent_contact();

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequent_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para direct_messages
CREATE POLICY "Users can view their own messages"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Políticas para frequent_contacts
CREATE POLICY "Users can view their own frequent contacts"
ON public.frequent_contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update frequent contacts"
ON public.frequent_contacts FOR ALL
USING (true);

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;