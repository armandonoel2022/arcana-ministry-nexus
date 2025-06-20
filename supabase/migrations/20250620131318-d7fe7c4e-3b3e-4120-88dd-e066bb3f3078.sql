
-- Crear tablas para el sistema de comunicación
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('general', 'department', 'private')),
  department VARCHAR(100),
  is_moderated BOOLEAN DEFAULT FALSE,
  moderator_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'image', 'system')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.walkie_talkie_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.walkie_talkie_transmissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.walkie_talkie_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  audio_url TEXT,
  duration_seconds INTEGER,
  transmission_type VARCHAR(50) DEFAULT 'voice' CHECK (transmission_type IN ('voice', 'emergency')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear triggers para updated_at
CREATE TRIGGER handle_updated_at_chat_rooms
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_chat_messages
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Habilitar RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walkie_talkie_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walkie_talkie_transmissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_rooms
CREATE POLICY "Users can view chat rooms they are members of" ON public.chat_rooms
  FOR SELECT USING (
    id IN (
      SELECT room_id FROM public.chat_room_members 
      WHERE user_id = auth.uid()
    ) OR room_type = 'general'
  );

CREATE POLICY "Moderators can update their rooms" ON public.chat_rooms
  FOR UPDATE USING (moderator_id = auth.uid());

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages in rooms they belong to" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.chat_room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in rooms they belong to" ON public.chat_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    room_id IN (
      SELECT room_id FROM public.chat_room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (user_id = auth.uid());

-- Políticas RLS para chat_room_members
CREATE POLICY "Users can view room members for rooms they belong to" ON public.chat_room_members
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.chat_room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms" ON public.chat_room_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas RLS para walkie_talkie
CREATE POLICY "Users can view walkie talkie channels" ON public.walkie_talkie_channels
  FOR SELECT USING (true);

CREATE POLICY "Users can view transmissions" ON public.walkie_talkie_transmissions
  FOR SELECT USING (true);

CREATE POLICY "Users can create transmissions" ON public.walkie_talkie_transmissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insertar salas de chat iniciales
INSERT INTO public.chat_rooms (name, description, room_type, is_moderated) VALUES
('Sala General', 'Comunicación general del ministerio', 'general', false),
('Músicos', 'Coordinación para músicos', 'department', true),
('Vocales', 'Coordinación para vocales', 'department', true),
('Logística', 'Comunicación del equipo de logística', 'department', true);

-- Insertar canal de walkie-talkie inicial
INSERT INTO public.walkie_talkie_channels (name, description) VALUES
('Canal Logística', 'Canal principal para el equipo de logística');

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.walkie_talkie_transmissions;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.walkie_talkie_transmissions REPLICA IDENTITY FULL;
