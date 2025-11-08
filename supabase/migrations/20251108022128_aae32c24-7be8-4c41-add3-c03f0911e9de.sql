-- Add media columns to chat_messages for voice notes and file attachments
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;