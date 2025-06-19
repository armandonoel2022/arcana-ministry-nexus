
-- Crear enum para roles de usuario
CREATE TYPE public.user_role AS ENUM ('admin', 'leader', 'musician', 'vocalist', 'member');

-- Crear enum para tipos de instrumento
CREATE TYPE public.instrument_type AS ENUM ('vocals', 'piano', 'guitar', 'bass', 'drums', 'percussion', 'saxophone', 'trumpet', 'violin', 'other');

-- Crear enum para estado de conocimiento de canciones
CREATE TYPE public.song_knowledge AS ENUM ('unknown', 'learning', 'known', 'expert');

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birthdate DATE,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  role user_role DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  joined_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Tabla de grupos de alabanza
CREATE TABLE public.worship_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color_theme TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de miembros por grupo
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.worship_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  instrument instrument_type NOT NULL,
  is_leader BOOLEAN DEFAULT false,
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id, instrument)
);

-- Tabla de servicios/eventos
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT DEFAULT 'regular', -- regular, special, rehearsal
  assigned_group_id UUID REFERENCES public.worship_groups(id),
  location TEXT DEFAULT 'Templo Principal',
  notes TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de repertorio musical
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  key_signature TEXT,
  tempo TEXT,
  genre TEXT,
  lyrics TEXT,
  chords TEXT,
  youtube_link TEXT,
  spotify_link TEXT,
  sheet_music_url TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conocimiento de canciones por usuario (sistema semáforo)
CREATE TABLE public.user_song_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  knowledge_level song_knowledge DEFAULT 'unknown',
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Insertar grupos iniciales
INSERT INTO public.worship_groups (name, description, color_theme) VALUES
('Grupo Alpha', 'Primer grupo de alabanza', '#3B82F6'),
('Grupo Beta', 'Segundo grupo de alabanza', '#10B981'),
('Grupo Gamma', 'Tercer grupo de alabanza', '#F59E0B');

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_worship_groups BEFORE UPDATE ON public.worship_groups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_songs BEFORE UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_song_knowledge ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (acceso completo para usuarios autenticados por ahora)
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can view worship groups" ON public.worship_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view services" ON public.services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view songs" ON public.songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert songs" ON public.songs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update songs" ON public.songs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can manage their song knowledge" ON public.user_song_knowledge FOR ALL TO authenticated USING (auth.uid() = user_id);
