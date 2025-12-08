-- Create table for live event state synchronization across devices
CREATE TABLE public.live_event_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.special_events(id) ON DELETE CASCADE,
  current_item_index INTEGER NOT NULL DEFAULT 0,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  preparation_seconds INTEGER NOT NULL DEFAULT 0,
  is_running BOOLEAN NOT NULL DEFAULT false,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  is_preparation_phase BOOLEAN NOT NULL DEFAULT false,
  completed_items INTEGER[] NOT NULL DEFAULT '{}',
  item_actual_times JSONB NOT NULL DEFAULT '{}',
  event_start_time TIMESTAMP WITH TIME ZONE,
  event_end_time TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for historical event statistics
CREATE TABLE public.event_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.special_events(id) ON DELETE CASCADE,
  total_planned_duration INTEGER NOT NULL,
  total_actual_duration INTEGER NOT NULL,
  total_preparation_time INTEGER NOT NULL,
  item_stats JSONB NOT NULL DEFAULT '[]',
  recommendations TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_statistics ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_event_sessions
CREATE POLICY "Authenticated users can view live sessions"
ON public.live_event_sessions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage live sessions"
ON public.live_event_sessions FOR ALL
USING (auth.uid() IS NOT NULL);

-- RLS policies for event_statistics
CREATE POLICY "Authenticated users can view event statistics"
ON public.event_statistics FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create event statistics"
ON public.event_statistics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for live_event_sessions
ALTER TABLE public.live_event_sessions REPLICA IDENTITY FULL;