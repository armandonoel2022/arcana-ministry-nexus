-- Crear tabla para configuración de notificaciones automáticas
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  notification_type TEXT NOT NULL DEFAULT 'service_overlay',
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  time TIME NOT NULL, -- HH:MM format
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  target_audience TEXT DEFAULT 'all' -- 'all', 'admins', 'specific_roles'
);

-- Enable RLS
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Administrators can manage scheduled notifications" 
ON public.scheduled_notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  )
);

CREATE POLICY "Authenticated users can view scheduled notifications" 
ON public.scheduled_notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE TRIGGER update_scheduled_notifications_updated_at
BEFORE UPDATE ON public.scheduled_notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default configurations for Monday, Thursday, Saturday at 7:30 AM
INSERT INTO public.scheduled_notifications (name, description, day_of_week, time, notification_type) VALUES
('Notificación Lunes', 'Overlay de servicios dominicales - Lunes 7:30 AM', 1, '07:30:00', 'service_overlay'),
('Notificación Jueves', 'Overlay de servicios dominicales - Jueves 7:30 AM', 4, '07:30:00', 'service_overlay'),
('Notificación Sábado', 'Overlay de servicios dominicales - Sábado 7:30 AM', 6, '07:30:00', 'service_overlay');