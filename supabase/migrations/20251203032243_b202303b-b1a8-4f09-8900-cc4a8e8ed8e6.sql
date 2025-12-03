-- Add worship_set_id to event_program_items to link with worship sets
ALTER TABLE public.event_program_items 
ADD COLUMN worship_set_id uuid REFERENCES public.event_worship_sets(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_event_program_items_worship_set_id ON public.event_program_items(worship_set_id);