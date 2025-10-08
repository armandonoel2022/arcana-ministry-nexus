-- Fix storage policies and add missing relationships to profiles for rehearsal features

-- 1) Add missing foreign keys to profiles for better PostgREST relationships
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rehearsal_sessions_created_by_fk'
  ) THEN
    ALTER TABLE public.rehearsal_sessions
      ADD CONSTRAINT rehearsal_sessions_created_by_fk
      FOREIGN KEY (created_by)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rehearsal_participants_user_id_fk'
  ) THEN
    ALTER TABLE public.rehearsal_participants
      ADD CONSTRAINT rehearsal_participants_user_id_fk
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rehearsal_participants_invited_by_fk'
  ) THEN
    ALTER TABLE public.rehearsal_participants
      ADD CONSTRAINT rehearsal_participants_invited_by_fk
      FOREIGN KEY (invited_by)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rehearsal_tracks_user_id_fk'
  ) THEN
    ALTER TABLE public.rehearsal_tracks
      ADD CONSTRAINT rehearsal_tracks_user_id_fk
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) Helper functions for Storage access control
CREATE OR REPLACE FUNCTION public.can_access_rehearsal_file(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  folders text[];
  session_uuid uuid;
  owner_id text;
BEGIN
  folders := storage.foldername(object_name);
  IF array_length(folders,1) < 2 THEN
    RETURN false;
  END IF;
  session_uuid := NULLIF(folders[1], '')::uuid;
  owner_id := folders[2];

  IF auth.uid()::text = owner_id THEN
    RETURN true;
  END IF;

  IF session_uuid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.rehearsal_sessions rs
    WHERE rs.id = session_uuid AND rs.created_by = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  IF session_uuid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.rehearsal_participants rp
    WHERE rp.session_id = session_uuid AND rp.user_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_rehearsal_file(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  folders text[];
  session_uuid uuid;
  owner_id text;
BEGIN
  folders := storage.foldername(object_name);
  IF array_length(folders,1) < 2 THEN
    RETURN false;
  END IF;
  session_uuid := NULLIF(folders[1], '')::uuid;
  owner_id := folders[2];

  -- Owner of the file can manage it
  IF auth.uid()::text = owner_id THEN
    RETURN true;
  END IF;

  -- Session creator can also manage all files in that session
  IF session_uuid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.rehearsal_sessions rs
    WHERE rs.id = session_uuid AND rs.created_by = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 3) Storage RLS policies for 'rehearsal-media' bucket
-- Remove old policies if they exist to avoid duplicates
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Rehearsal media: select access'
  ) THEN
    DROP POLICY "Rehearsal media: select access" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Rehearsal media: insert own'
  ) THEN
    DROP POLICY "Rehearsal media: insert own" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Rehearsal media: update own or session'
  ) THEN
    DROP POLICY "Rehearsal media: update own or session" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Rehearsal media: delete own or creator'
  ) THEN
    DROP POLICY "Rehearsal media: delete own or creator" ON storage.objects;
  END IF;
END $$;

-- SELECT: participants, session creator, or file owner can read
CREATE POLICY "Rehearsal media: select access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'rehearsal-media'
  AND public.can_access_rehearsal_file(name)
);

-- INSERT: only into your own user folder path: sessionId/<yourUserId>/...
CREATE POLICY "Rehearsal media: insert own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rehearsal-media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- UPDATE: owner or session creator
CREATE POLICY "Rehearsal media: update own or session"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rehearsal-media' AND public.can_manage_rehearsal_file(name)
)
WITH CHECK (
  bucket_id = 'rehearsal-media' AND public.can_manage_rehearsal_file(name)
);

-- DELETE: owner or session creator
CREATE POLICY "Rehearsal media: delete own or creator"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'rehearsal-media' AND public.can_manage_rehearsal_file(name)
);
