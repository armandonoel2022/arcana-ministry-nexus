
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS album text,
  ADD COLUMN IF NOT EXISTS composer text,
  ADD COLUMN IF NOT EXISTS ccli text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS song_type text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS time_signature text,
  ADD COLUMN IF NOT EXISTS capo integer,
  ADD COLUMN IF NOT EXISTS tuning text,
  ADD COLUMN IF NOT EXISTS vocal_range text;
