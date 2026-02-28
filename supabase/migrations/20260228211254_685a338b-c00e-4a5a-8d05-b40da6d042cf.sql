
ALTER TABLE public.song_selections 
ADD COLUMN song_purpose text DEFAULT 'worship';

COMMENT ON COLUMN public.song_selections.song_purpose IS 'Purpose of the song: worship, offering, or communion';
