-- Add highlight_color column to event_program_items for optional row highlighting in PDF
ALTER TABLE public.event_program_items 
ADD COLUMN highlight_color TEXT DEFAULT NULL;