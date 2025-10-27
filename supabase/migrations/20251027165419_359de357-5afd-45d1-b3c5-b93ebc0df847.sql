-- Add actions column to chat_messages to persist interactive buttons
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS actions jsonb;

-- Optional: create a check to ensure actions is an array when present
-- Using a trigger is overkill; allow any JSON and validate in app

-- No RLS changes needed; existing INSERT/SELECT policies apply.
