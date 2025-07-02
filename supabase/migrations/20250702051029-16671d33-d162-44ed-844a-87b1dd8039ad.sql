
-- Crear tabla para manejar las selecciones de canciones con notificaciones
CREATE TABLE public.song_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  selected_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selection_reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para song_selections
ALTER TABLE public.song_selections ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver las selecciones
CREATE POLICY "Anyone can view song selections" 
  ON public.song_selections 
  FOR SELECT 
  USING (true);

-- Política para que usuarios autenticados puedan crear selecciones
CREATE POLICY "Authenticated users can create song selections" 
  ON public.song_selections 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND selected_by = auth.uid());

-- Política para que solo el creador pueda actualizar
CREATE POLICY "Users can update their own song selections" 
  ON public.song_selections 
  FOR UPDATE 
  USING (selected_by = auth.uid());

-- Crear trigger para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.song_selections
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Agregar campos para mejorar las notificaciones de agenda
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS notification_category VARCHAR(50) DEFAULT 'general';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Función para obtener servicios de la agenda con detalles completos
CREATE OR REPLACE FUNCTION public.get_agenda_services_for_notification(target_date date)
RETURNS TABLE(
  service_id uuid,
  service_title text,
  service_date timestamp with time zone,
  service_time text,
  leader_name text,
  leader_photo text,
  group_name text,
  group_color text,
  special_activity text,
  location text
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.service_date,
    to_char(s.service_date, 'HH12:MI AM') as service_time,
    s.leader as leader_name,
    p.photo_url as leader_photo,
    wg.name as group_name,
    wg.color_theme as group_color,
    s.special_activity,
    s.location
  FROM public.services s
  LEFT JOIN public.profiles p ON LOWER(p.full_name) = LOWER(s.leader)
  LEFT JOIN public.worship_groups wg ON s.assigned_group_id = wg.id
  WHERE DATE(s.service_date) = target_date
  ORDER BY s.service_date;
$$;
