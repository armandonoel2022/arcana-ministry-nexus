-- Add objectives field to special_events table
ALTER TABLE public.special_events
ADD COLUMN objectives TEXT NULL;