ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS bpm integer,
  ADD COLUMN IF NOT EXISTS lyrics_format jsonb NOT NULL DEFAULT '{}'::jsonb;