-- Table for member aliases (for ARCANA AI to use custom names)
CREATE TABLE IF NOT EXISTS public.member_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.member_aliases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active aliases" ON public.member_aliases;
DROP POLICY IF EXISTS "Users can create aliases for themselves" ON public.member_aliases;
DROP POLICY IF EXISTS "Users can update their own aliases" ON public.member_aliases;

-- Policies for member_aliases
CREATE POLICY "Anyone can view active aliases" 
ON public.member_aliases 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create aliases for themselves" 
ON public.member_aliases 
FOR INSERT 
WITH CHECK (profile_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can update their own aliases" 
ON public.member_aliases 
FOR UPDATE 
USING (profile_id = auth.uid() OR created_by = auth.uid());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_member_aliases_profile ON public.member_aliases(profile_id);