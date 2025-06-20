
-- Crear enum para los cargos/roles
CREATE TYPE member_role AS ENUM (
  'pastor', 'pastora', 'director_alabanza', 'directora_alabanza', 
  'corista', 'directora_danza', 'director_multimedia', 'camarografo', 
  'camarógrafa', 'encargado_piso', 'encargada_piso', 'musico', 
  'sonidista', 'encargado_luces', 'encargado_proyeccion', 
  'encargado_streaming'
);

-- Crear enum para los grupos
CREATE TYPE member_group AS ENUM (
  'directiva', 'directores_alabanza', 'coristas', 'multimedia', 
  'danza', 'teatro', 'piso'
);

-- Crear enum para tipos de sangre
CREATE TYPE blood_type AS ENUM (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

-- Crear tabla de miembros
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  photo_url TEXT,
  cargo member_role NOT NULL,
  fecha_nacimiento DATE,
  telefono TEXT,
  celular TEXT,
  email TEXT,
  direccion TEXT,
  referencias TEXT,
  grupo member_group,
  persona_reporte TEXT,
  voz_instrumento TEXT,
  tipo_sangre blood_type,
  contacto_emergencia TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir lectura a todos los usuarios autenticados)
CREATE POLICY "Anyone can view active members" ON public.members
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only authenticated users can insert members" ON public.members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update members" ON public.members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete members" ON public.members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_members_nombres ON public.members(nombres);
CREATE INDEX idx_members_apellidos ON public.members(apellidos);
CREATE INDEX idx_members_cargo ON public.members(cargo);
CREATE INDEX idx_members_grupo ON public.members(grupo);
CREATE INDEX idx_members_active ON public.members(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER handle_updated_at_members
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Crear bucket para las fotos de los miembros
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-photos', 'member-photos', true);

-- Política para el bucket de fotos (permitir acceso público para lectura)
CREATE POLICY "Public can view member photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can upload member photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'member-photos' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update member photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'member-photos' AND 
    auth.uid() IS NOT NULL
  );
