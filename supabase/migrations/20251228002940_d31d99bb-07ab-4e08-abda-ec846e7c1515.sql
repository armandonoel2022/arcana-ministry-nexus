-- Add missing notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'pregnancy_reveal';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'birth_announcement';

-- Create app_role enum for role-based access control
DO $$ 
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'lider', 'vocal', 'musico', 'miembro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table for RBAC
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role)
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create screen_permissions table to define what each role can access
CREATE TABLE IF NOT EXISTS public.screen_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  screen_path text NOT NULL,
  screen_name text NOT NULL,
  screen_category text NOT NULL,
  can_view boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (role, screen_path)
);

-- Enable RLS
ALTER TABLE public.screen_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for screen_permissions
CREATE POLICY "Anyone authenticated can view screen permissions"
  ON public.screen_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage screen permissions"
  ON public.screen_permissions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default permissions for all roles
-- Admin: Full access
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit) VALUES
  ('admin', '/', 'Home', 'Principal', true, true),
  ('admin', '/notificaciones', 'Notificaciones', 'Principal', true, true),
  ('admin', '/agenda', 'Agenda Ministerial', 'Ministerio', true, true),
  ('admin', '/reemplazos', 'Reemplazos de Director', 'Ministerio', true, true),
  ('admin', '/repertorio', 'Repertorio Musical', 'Ministerio', true, true),
  ('admin', '/ensayos', 'Ensayos Colaborativos', 'Ministerio', true, true),
  ('admin', '/eventos', 'Eventos Especiales', 'Ministerio', true, true),
  ('admin', '/comunicacion', 'Comunicación', 'Comunidad', true, true),
  ('admin', '/integrantes', 'Integrantes', 'Comunidad', true, true),
  ('admin', '/grupos', 'Grupos de Alabanza', 'Comunidad', true, true),
  ('admin', '/cumpleanos', 'Cumpleaños', 'Comunidad', true, true),
  ('admin', '/recomendaciones', 'Recomendaciones', 'Comunidad', true, true),
  ('admin', '/asistente', 'Asistente Personal', 'Personal', true, true),
  ('admin', '/espiritual', 'Módulo Espiritual', 'Personal', true, true),
  ('admin', '/configuracion', 'Configuración', 'Configuración', true, true),
  ('admin', '/admin', 'Administración', 'Configuración', true, true),
  ('admin', '/pruebas-notificaciones', 'Pruebas de Notificaciones', 'Configuración', true, true),
  ('admin', '/acerca', 'Acerca del Ministerio', 'Configuración', true, true),
  ('admin', '/estatutos', 'Estatutos', 'Configuración', true, true),
  ('admin', '/notificaciones-programadas', 'Notificaciones Programadas', 'Administración Avanzada', true, true)
ON CONFLICT (role, screen_path) DO NOTHING;

-- Lider: Almost full access except admin screens
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit) VALUES
  ('lider', '/', 'Home', 'Principal', true, true),
  ('lider', '/notificaciones', 'Notificaciones', 'Principal', true, true),
  ('lider', '/agenda', 'Agenda Ministerial', 'Ministerio', true, true),
  ('lider', '/reemplazos', 'Reemplazos de Director', 'Ministerio', true, true),
  ('lider', '/repertorio', 'Repertorio Musical', 'Ministerio', true, true),
  ('lider', '/ensayos', 'Ensayos Colaborativos', 'Ministerio', true, true),
  ('lider', '/eventos', 'Eventos Especiales', 'Ministerio', true, true),
  ('lider', '/comunicacion', 'Comunicación', 'Comunidad', true, true),
  ('lider', '/integrantes', 'Integrantes', 'Comunidad', true, true),
  ('lider', '/grupos', 'Grupos de Alabanza', 'Comunidad', true, true),
  ('lider', '/cumpleanos', 'Cumpleaños', 'Comunidad', true, true),
  ('lider', '/recomendaciones', 'Recomendaciones', 'Comunidad', true, true),
  ('lider', '/asistente', 'Asistente Personal', 'Personal', true, true),
  ('lider', '/espiritual', 'Módulo Espiritual', 'Personal', true, true),
  ('lider', '/configuracion', 'Configuración', 'Configuración', true, true),
  ('lider', '/acerca', 'Acerca del Ministerio', 'Configuración', true, false),
  ('lider', '/estatutos', 'Estatutos', 'Configuración', true, false)
ON CONFLICT (role, screen_path) DO NOTHING;

-- Vocal: Can see replacements but limited edit
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit) VALUES
  ('vocal', '/', 'Home', 'Principal', true, false),
  ('vocal', '/notificaciones', 'Notificaciones', 'Principal', true, false),
  ('vocal', '/agenda', 'Agenda Ministerial', 'Ministerio', true, false),
  ('vocal', '/reemplazos', 'Reemplazos de Director', 'Ministerio', true, false),
  ('vocal', '/repertorio', 'Repertorio Musical', 'Ministerio', true, false),
  ('vocal', '/ensayos', 'Ensayos Colaborativos', 'Ministerio', true, true),
  ('vocal', '/eventos', 'Eventos Especiales', 'Ministerio', true, false),
  ('vocal', '/comunicacion', 'Comunicación', 'Comunidad', true, true),
  ('vocal', '/integrantes', 'Integrantes', 'Comunidad', true, false),
  ('vocal', '/grupos', 'Grupos de Alabanza', 'Comunidad', true, false),
  ('vocal', '/cumpleanos', 'Cumpleaños', 'Comunidad', true, false),
  ('vocal', '/recomendaciones', 'Recomendaciones', 'Comunidad', true, true),
  ('vocal', '/asistente', 'Asistente Personal', 'Personal', true, true),
  ('vocal', '/espiritual', 'Módulo Espiritual', 'Personal', true, true),
  ('vocal', '/configuracion', 'Configuración', 'Configuración', true, true),
  ('vocal', '/acerca', 'Acerca del Ministerio', 'Configuración', true, false),
  ('vocal', '/estatutos', 'Estatutos', 'Configuración', true, false)
ON CONFLICT (role, screen_path) DO NOTHING;

-- Musico: Similar to vocal
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit) VALUES
  ('musico', '/', 'Home', 'Principal', true, false),
  ('musico', '/notificaciones', 'Notificaciones', 'Principal', true, false),
  ('musico', '/agenda', 'Agenda Ministerial', 'Ministerio', true, false),
  ('musico', '/repertorio', 'Repertorio Musical', 'Ministerio', true, false),
  ('musico', '/ensayos', 'Ensayos Colaborativos', 'Ministerio', true, true),
  ('musico', '/eventos', 'Eventos Especiales', 'Ministerio', true, false),
  ('musico', '/comunicacion', 'Comunicación', 'Comunidad', true, true),
  ('musico', '/integrantes', 'Integrantes', 'Comunidad', true, false),
  ('musico', '/grupos', 'Grupos de Alabanza', 'Comunidad', true, false),
  ('musico', '/cumpleanos', 'Cumpleaños', 'Comunidad', true, false),
  ('musico', '/recomendaciones', 'Recomendaciones', 'Comunidad', true, true),
  ('musico', '/asistente', 'Asistente Personal', 'Personal', true, true),
  ('musico', '/espiritual', 'Módulo Espiritual', 'Personal', true, true),
  ('musico', '/configuracion', 'Configuración', 'Configuración', true, true),
  ('musico', '/acerca', 'Acerca del Ministerio', 'Configuración', true, false),
  ('musico', '/estatutos', 'Estatutos', 'Configuración', true, false)
ON CONFLICT (role, screen_path) DO NOTHING;

-- Miembro: Most restricted - no access to director replacements
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit) VALUES
  ('miembro', '/', 'Home', 'Principal', true, false),
  ('miembro', '/notificaciones', 'Notificaciones', 'Principal', true, false),
  ('miembro', '/agenda', 'Agenda Ministerial', 'Ministerio', true, false),
  ('miembro', '/repertorio', 'Repertorio Musical', 'Ministerio', true, false),
  ('miembro', '/ensayos', 'Ensayos Colaborativos', 'Ministerio', true, true),
  ('miembro', '/eventos', 'Eventos Especiales', 'Ministerio', true, false),
  ('miembro', '/comunicacion', 'Comunicación', 'Comunidad', true, true),
  ('miembro', '/integrantes', 'Integrantes', 'Comunidad', true, false),
  ('miembro', '/grupos', 'Grupos de Alabanza', 'Comunidad', true, false),
  ('miembro', '/cumpleanos', 'Cumpleaños', 'Comunidad', true, false),
  ('miembro', '/recomendaciones', 'Recomendaciones', 'Comunidad', true, true),
  ('miembro', '/asistente', 'Asistente Personal', 'Personal', true, true),
  ('miembro', '/espiritual', 'Módulo Espiritual', 'Personal', true, true),
  ('miembro', '/configuracion', 'Configuración', 'Configuración', true, true),
  ('miembro', '/acerca', 'Acerca del Ministerio', 'Configuración', true, false),
  ('miembro', '/estatutos', 'Estatutos', 'Configuración', true, false)
ON CONFLICT (role, screen_path) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_screen_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_screen_permissions_timestamp
  BEFORE UPDATE ON public.screen_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_screen_permissions_updated_at();