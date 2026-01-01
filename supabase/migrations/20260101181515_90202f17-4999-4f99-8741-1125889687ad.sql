-- Fix: event_program_items.time_slot should store a display range like "21:00 - 21:30"
-- Currently it's TIME which rejects range strings.

ALTER TABLE public.event_program_items
  ALTER COLUMN time_slot TYPE text
  USING (to_char(time_slot, 'HH24:MI'));

COMMENT ON COLUMN public.event_program_items.time_slot IS 'Display time range for the program item (e.g., 21:00 - 21:30).';
