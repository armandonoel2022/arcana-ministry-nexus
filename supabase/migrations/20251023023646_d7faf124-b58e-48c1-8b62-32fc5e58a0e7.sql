-- Create public storage bucket for rehearsal tracks (idempotent)
insert into storage.buckets (id, name, public)
values ('rehearsal-tracks', 'rehearsal-tracks', true)
on conflict (id) do nothing;

-- Policy: Public can view rehearsal tracks (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Rehearsal tracks public select'
  ) THEN
    CREATE POLICY "Rehearsal tracks public select"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'rehearsal-tracks');
  END IF;
END
$$;

-- Policy: Authenticated users can upload to paths where second folder = their user id (sessionId/userId/filename)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Rehearsal tracks user insert'
  ) THEN
    CREATE POLICY "Rehearsal tracks user insert"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'rehearsal-tracks'
      AND auth.uid() IS NOT NULL
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END
$$;

-- Policy: Authenticated users can update their own objects within same path rule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Rehearsal tracks user update'
  ) THEN
    CREATE POLICY "Rehearsal tracks user update"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'rehearsal-tracks'
      AND auth.uid() IS NOT NULL
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'rehearsal-tracks'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END
$$;

-- Policy: Authenticated users can delete their own objects within same path rule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Rehearsal tracks user delete'
  ) THEN
    CREATE POLICY "Rehearsal tracks user delete"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'rehearsal-tracks'
      AND auth.uid() IS NOT NULL
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END
$$;