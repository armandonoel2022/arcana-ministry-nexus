-- Replace can_access_rehearsal_file to avoid recursion by not touching rehearsal_participants
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

  -- File owner can access
  IF auth.uid()::text = owner_id THEN
    RETURN true;
  END IF;

  -- Session creator can access files of their session
  IF session_uuid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.rehearsal_sessions rs
    WHERE rs.id = session_uuid AND rs.created_by = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;