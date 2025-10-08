-- Fix search_path for security
DROP FUNCTION IF EXISTS add_creator_as_participant() CASCADE;

CREATE OR REPLACE FUNCTION add_creator_as_participant()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rehearsal_participants (session_id, user_id, role, invitation_status)
  VALUES (NEW.id, NEW.created_by, 'creator', 'accepted');
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_session_created
  AFTER INSERT ON public.rehearsal_sessions
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_participant();