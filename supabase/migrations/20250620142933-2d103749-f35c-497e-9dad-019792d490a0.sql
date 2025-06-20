
-- Agregar columna is_bot a la tabla chat_messages para identificar mensajes del bot
ALTER TABLE public.chat_messages ADD COLUMN is_bot BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar las consultas de mensajes del bot
CREATE INDEX idx_chat_messages_is_bot ON public.chat_messages(is_bot);
