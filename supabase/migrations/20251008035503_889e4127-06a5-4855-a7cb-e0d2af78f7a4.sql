-- Add session participants table
CREATE TABLE IF NOT EXISTS public.rehearsal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.rehearsal_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant', -- 'creator', 'participant', 'invited'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  invitation_status TEXT DEFAULT 'accepted', -- 'pending', 'accepted', 'declined'
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.rehearsal_participants ENABLE ROW LEVEL SECURITY;

-- Policies for rehearsal_participants
CREATE POLICY "Users can view participants in their sessions"
  ON public.rehearsal_participants FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.rehearsal_participants WHERE session_id = rehearsal_participants.session_id
    )
  );

CREATE POLICY "Users can join sessions they're invited to"
  ON public.rehearsal_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.rehearsal_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Session creators can manage participants"
  ON public.rehearsal_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rehearsal_sessions 
      WHERE id = rehearsal_participants.session_id 
      AND created_by = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX idx_rehearsal_participants_session ON public.rehearsal_participants(session_id);
CREATE INDEX idx_rehearsal_participants_user ON public.rehearsal_participants(user_id);

-- Update rehearsal_sessions to have better naming
ALTER TABLE public.rehearsal_sessions 
  ADD COLUMN IF NOT EXISTS session_name TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Update existing sessions to have proper names
UPDATE public.rehearsal_sessions 
SET session_name = title || ' - ' || to_char(created_at, 'DD/MM/YYYY HH24:MI')
WHERE session_name IS NULL;

-- Add trigger to auto-add creator as participant
CREATE OR REPLACE FUNCTION add_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.rehearsal_participants (session_id, user_id, role, invitation_status)
  VALUES (NEW.id, NEW.created_by, 'creator', 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_session_created
  AFTER INSERT ON public.rehearsal_sessions
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_participant();

-- Allow admins to delete any session
CREATE POLICY "Admins can delete any session"
  ON public.rehearsal_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'administrator'
    )
  );

-- Update tracks table to link to participants
ALTER TABLE public.rehearsal_tracks
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES public.rehearsal_participants(id) ON DELETE CASCADE;