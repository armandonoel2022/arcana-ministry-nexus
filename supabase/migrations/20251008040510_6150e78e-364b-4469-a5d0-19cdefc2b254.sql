-- Add foreign keys only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rehearsal_participants_user_id_fkey'
  ) THEN
    ALTER TABLE public.rehearsal_participants
      ADD CONSTRAINT rehearsal_participants_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rehearsal_participants_invited_by_fkey'
  ) THEN
    ALTER TABLE public.rehearsal_participants
      ADD CONSTRAINT rehearsal_participants_invited_by_fkey
      FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rehearsal_tracks_user_id_fkey'
  ) THEN
    ALTER TABLE public.rehearsal_tracks
      ADD CONSTRAINT rehearsal_tracks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recordings in their sessions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own recordings" ON storage.objects;

-- Create storage policies for rehearsal-media bucket
CREATE POLICY "Users can upload their own recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rehearsal-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.rehearsal_sessions WHERE created_by = auth.uid()
      UNION
      SELECT session_id::text FROM public.rehearsal_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view recordings in their sessions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'rehearsal-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.rehearsal_sessions WHERE created_by = auth.uid()
      UNION
      SELECT session_id::text FROM public.rehearsal_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rehearsal-media' AND
    (storage.foldername(name))[2]::uuid = auth.uid()
  );

CREATE POLICY "Users can update their own recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rehearsal-media' AND
    (storage.foldername(name))[2]::uuid = auth.uid()
  );

-- Add track_name column to identify different voice parts/instruments
ALTER TABLE public.rehearsal_tracks
  ADD COLUMN IF NOT EXISTS track_name TEXT DEFAULT 'Pista principal';

-- Add is_backing_track to identify base tracks
ALTER TABLE public.rehearsal_tracks
  ADD COLUMN IF NOT EXISTS is_backing_track BOOLEAN DEFAULT false;