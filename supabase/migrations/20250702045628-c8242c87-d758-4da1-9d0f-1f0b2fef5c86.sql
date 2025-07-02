
-- First, let's create a table to track director replacement requests
CREATE TABLE public.director_replacement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  original_director_id UUID NOT NULL REFERENCES public.profiles(id),
  replacement_director_id UUID NOT NULL REFERENCES public.profiles(id),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.director_replacement_requests ENABLE ROW LEVEL SECURITY;

-- Directors can create replacement requests for their own services
CREATE POLICY "Directors can create replacement requests" 
  ON public.director_replacement_requests 
  FOR INSERT 
  WITH CHECK (original_director_id = auth.uid());

-- Users can view requests they're involved in
CREATE POLICY "Users can view requests they're involved in" 
  ON public.director_replacement_requests 
  FOR SELECT 
  USING (original_director_id = auth.uid() OR replacement_director_id = auth.uid());

-- Replacement directors can respond to requests
CREATE POLICY "Replacement directors can respond" 
  ON public.director_replacement_requests 
  FOR UPDATE 
  USING (replacement_director_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.director_replacement_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create a function to get available directors (excluding the requesting director)
CREATE OR REPLACE FUNCTION public.get_available_directors(exclude_director_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT p.id, p.full_name, p.phone, p.email
  FROM public.profiles p
  WHERE p.role IN ('leader', 'administrator')
    AND p.is_active = true
    AND p.id != exclude_director_id;
$$;

-- Create a function to automatically expire pending requests
CREATE OR REPLACE FUNCTION public.expire_pending_replacements()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.director_replacement_requests
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$;
