-- Add song_purpose column to service_songs to distinguish worship/offering/communion songs
ALTER TABLE public.service_songs 
ADD COLUMN song_purpose text NOT NULL DEFAULT 'worship';

-- Add check constraint for valid values
ALTER TABLE public.service_songs
ADD CONSTRAINT service_songs_purpose_check 
CHECK (song_purpose IN ('worship', 'offering', 'communion'));

-- Add comment for documentation
COMMENT ON COLUMN public.service_songs.song_purpose IS 'Purpose of the song: worship (alabanza), offering (ofrendas), communion (santa cena/comunión)';