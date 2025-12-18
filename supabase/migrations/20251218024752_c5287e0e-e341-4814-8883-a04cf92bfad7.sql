-- Create enum for replacement types
CREATE TYPE replacement_category AS ENUM ('voice', 'musician', 'multimedia');

-- Create voice_replacement_requests table for chorus members
CREATE TABLE public.voice_replacement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  original_member_id UUID NOT NULL,
  replacement_member_id UUID NOT NULL,
  group_name TEXT NOT NULL, -- 'Grupo de Aleida', 'Grupo de Keyla', 'Grupo de Massy'
  voice_type TEXT, -- 'Soprano', 'Contralto', 'Tenor', 'Bajo'
  mic_position INTEGER, -- 1-5
  reason TEXT,
  notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create musician_replacement_requests table
CREATE TABLE public.musician_replacement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  original_member_id UUID NOT NULL,
  replacement_member_id UUID NOT NULL,
  instrument TEXT NOT NULL, -- 'Piano', 'Guitarra', 'Batería', 'Bajo', etc.
  reason TEXT,
  notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create multimedia_replacement_requests table
CREATE TABLE public.multimedia_replacement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  original_member_id UUID NOT NULL,
  replacement_member_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'Cámaras', 'Sonido', 'Proyección', 'Streaming', etc.
  reason TEXT,
  notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.voice_replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musician_replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimedia_replacement_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_replacement_requests
CREATE POLICY "Users can view voice replacement requests they're involved in"
ON public.voice_replacement_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    WHERE (m.id = original_member_id OR m.id = replacement_member_id)
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'leader'))
);

CREATE POLICY "Authenticated users can create voice replacement requests"
ON public.voice_replacement_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Replacement members can respond to requests"
ON public.voice_replacement_requests FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for musician_replacement_requests
CREATE POLICY "Users can view musician replacement requests"
ON public.musician_replacement_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'leader'))
  OR auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can create musician replacement requests"
ON public.musician_replacement_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update musician replacement requests"
ON public.musician_replacement_requests FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for multimedia_replacement_requests
CREATE POLICY "Users can view multimedia replacement requests"
ON public.multimedia_replacement_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'leader'))
  OR auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can create multimedia replacement requests"
ON public.multimedia_replacement_requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update multimedia replacement requests"
ON public.multimedia_replacement_requests FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Add Realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_replacement_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.musician_replacement_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.multimedia_replacement_requests;