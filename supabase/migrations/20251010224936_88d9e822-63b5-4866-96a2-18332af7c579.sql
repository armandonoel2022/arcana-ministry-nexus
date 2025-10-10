-- Make rehearsal-media bucket public so audio URLs work with getPublicUrl
DO $$
BEGIN
  UPDATE storage.buckets SET public = true WHERE id = 'rehearsal-media';
END $$;

-- Create storage policies if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'rehearsal-media read files'
  ) THEN
    CREATE POLICY "rehearsal-media read files"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'rehearsal-media'
        AND public.can_access_rehearsal_file(name)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'rehearsal-media upload files'
  ) THEN
    CREATE POLICY "rehearsal-media upload files"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'rehearsal-media'
        AND public.can_manage_rehearsal_file(name)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'rehearsal-media update files'
  ) THEN
    CREATE POLICY "rehearsal-media update files"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'rehearsal-media'
        AND public.can_manage_rehearsal_file(name)
      )
      WITH CHECK (
        bucket_id = 'rehearsal-media'
        AND public.can_manage_rehearsal_file(name)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'rehearsal-media delete files'
  ) THEN
    CREATE POLICY "rehearsal-media delete files"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'rehearsal-media'
        AND public.can_manage_rehearsal_file(name)
      );
  END IF;
END $$;