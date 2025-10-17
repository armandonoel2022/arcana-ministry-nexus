-- Add start_offset to rehearsal_tracks to store recording sync position (seconds)
ALTER TABLE public.rehearsal_tracks
ADD COLUMN IF NOT EXISTS start_offset double precision NOT NULL DEFAULT 0;

-- Optional: comment for clarity
COMMENT ON COLUMN public.rehearsal_tracks.start_offset IS 'Inicio en segundos relativo al 0 global del DAW';