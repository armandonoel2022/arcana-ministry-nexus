
-- Agregar campo para tipo de vista del repertorio
ALTER TABLE public.profiles 
ADD COLUMN repertory_view_preference text DEFAULT 'list' CHECK (repertory_view_preference IN ('list', 'grid'));

-- Crear tabla para notificaciones del sistema
CREATE TABLE public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('repertory_update', 'agenda_update', 'director_replacement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para configuración de notificaciones
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  repertory_notifications BOOLEAN DEFAULT true,
  agenda_notifications BOOLEAN DEFAULT true,
  director_replacement_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para el flujo de reemplazo de directores
CREATE TABLE public.director_replacements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  original_director_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  replacement_director_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar campos adicionales a la tabla songs para mejor filtrado
ALTER TABLE public.songs 
ADD COLUMN mood VARCHAR(50),
ADD COLUMN theme VARCHAR(100),
ADD COLUMN director_notes TEXT,
ADD COLUMN last_used_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN usage_count INTEGER DEFAULT 0;

-- Agregar índices para mejorar rendimiento
CREATE INDEX idx_system_notifications_recipient ON public.system_notifications(recipient_id);
CREATE INDEX idx_system_notifications_type ON public.system_notifications(type);
CREATE INDEX idx_system_notifications_created_at ON public.system_notifications(created_at);
CREATE INDEX idx_director_replacements_service ON public.director_replacements(service_id);
CREATE INDEX idx_director_replacements_status ON public.director_replacements(status);
CREATE INDEX idx_songs_mood ON public.songs(mood);
CREATE INDEX idx_songs_theme ON public.songs(theme);
CREATE INDEX idx_songs_last_used ON public.songs(last_used_date);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.director_replacements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.system_notifications 
  FOR SELECT 
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON public.system_notifications 
  FOR UPDATE 
  USING (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can send notifications" 
  ON public.system_notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para notification_settings
CREATE POLICY "Users can manage their notification settings" 
  ON public.notification_settings 
  FOR ALL 
  USING (user_id = auth.uid());

-- Políticas RLS para director_replacements
CREATE POLICY "Users can view replacements they're involved in" 
  ON public.director_replacements 
  FOR SELECT 
  USING (original_director_id = auth.uid() OR replacement_director_id = auth.uid());

CREATE POLICY "Directors can create replacement requests" 
  ON public.director_replacements 
  FOR INSERT 
  WITH CHECK (original_director_id = auth.uid());

CREATE POLICY "Replacement directors can respond" 
  ON public.director_replacements 
  FOR UPDATE 
  USING (replacement_director_id = auth.uid());

-- Crear triggers para updated_at
CREATE TRIGGER handle_updated_at_system_notifications BEFORE UPDATE ON public.system_notifications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_notification_settings BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_director_replacements BEFORE UPDATE ON public.director_replacements
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Función para obtener directores disponibles (excluyendo el director original)
CREATE OR REPLACE FUNCTION get_available_directors(exclude_director_id UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.id, p.full_name, p.phone, p.email
  FROM public.profiles p
  WHERE p.role IN ('leader', 'administrator')
    AND p.is_active = true
    AND p.id != exclude_director_id;
$$;

-- Función para marcar expiración automática de solicitudes de reemplazo
CREATE OR REPLACE FUNCTION expire_pending_replacements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.director_replacements
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$;
