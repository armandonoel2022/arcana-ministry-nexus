-- Crear tabla para usuarios del ministerio (exentos de pago)
CREATE TABLE IF NOT EXISTS public.ministry_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  position text NOT NULL, -- pastor, leader, director, coordinator, member
  department text, -- danza, massy, keyla, aleida, musical, multimedia, programming
  is_exempt_from_subscription boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ministry_members
CREATE POLICY "Administrators can manage ministry members"
  ON public.ministry_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "Users can view all ministry members"
  ON public.ministry_members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Crear tabla para eventos especiales
CREATE TABLE IF NOT EXISTS public.special_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date timestamptz NOT NULL,
  location text DEFAULT 'Templo Principal',
  description text,
  event_type text DEFAULT 'special', -- special, conference, vigil, retreat, etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for special_events
CREATE POLICY "Authenticated users can view special events"
  ON public.special_events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can create special events"
  ON public.special_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role = 'administrator' OR role = 'leader')
    )
  );

CREATE POLICY "Event creators can update their events"
  ON public.special_events
  FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  ));

CREATE POLICY "Administrators can delete events"
  ON public.special_events
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  ));

-- Crear tabla para el programa de eventos
CREATE TABLE IF NOT EXISTS public.event_program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.special_events(id) ON DELETE CASCADE NOT NULL,
  time_slot time,
  title text NOT NULL,
  description text,
  responsible_person text,
  duration_minutes integer,
  item_order integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_program_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_program_items
CREATE POLICY "Authenticated users can view event program items"
  ON public.event_program_items
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage event program items"
  ON public.event_program_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role = 'administrator' OR role = 'leader')
    )
  );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_ministry_members_updated_at
  BEFORE UPDATE ON public.ministry_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_updated_at();

CREATE TRIGGER update_special_events_updated_at
  BEFORE UPDATE ON public.special_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_updated_at();

CREATE TRIGGER update_event_program_items_updated_at
  BEFORE UPDATE ON public.event_program_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_updated_at();

-- Insertar los líderes del ministerio (esto se hará después de que se registren)
-- Por ahora solo creamos la estructura