
-- Table to store per-director preferred keys for songs
CREATE TABLE public.director_song_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  director_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  preferred_key TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(director_id, song_id)
);

-- Add preferred_key to song_selections (the key used for THIS specific service)
ALTER TABLE public.song_selections ADD COLUMN preferred_key TEXT;

-- Enable RLS
ALTER TABLE public.director_song_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view director song keys"
  ON public.director_song_keys FOR SELECT
  USING (true);

CREATE POLICY "Directors can manage their own song keys"
  ON public.director_song_keys FOR ALL
  USING (auth.uid() = director_id)
  WITH CHECK (auth.uid() = director_id);

-- Trigger for updated_at
CREATE TRIGGER update_director_song_keys_updated_at
  BEFORE UPDATE ON public.director_song_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Recreate the view to include preferred_key
DROP VIEW IF EXISTS public.service_selected_songs;

CREATE VIEW public.service_selected_songs AS
SELECT 
  ss.service_id,
  ss.song_id,
  ss.selected_by,
  ss.selection_reason,
  ss.created_at AS selected_at,
  ss.preferred_key,
  s.title AS song_title,
  s.artist,
  s.key_signature,
  s.difficulty_level,
  s.category,
  p.full_name AS selected_by_name,
  srv.title AS service_title,
  srv.service_date,
  srv.leader AS service_leader
FROM song_selections ss
JOIN songs s ON ss.song_id = s.id
JOIN profiles p ON ss.selected_by = p.id
JOIN services srv ON ss.service_id = srv.id;
