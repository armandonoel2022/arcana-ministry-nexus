-- Crear tabla para entrenamiento vocal
CREATE TABLE public.vocal_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voice_type TEXT NOT NULL CHECK (voice_type IN ('soprano', 'mezzo_soprano', 'alto', 'tenor', 'baritono', 'bajo')),
  exercise_name TEXT NOT NULL,
  exercise_description TEXT,
  audio_url TEXT,
  video_url TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  duration_minutes INTEGER,
  target_skills TEXT[],
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para entrenamiento musical
CREATE TABLE public.instrument_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instrument TEXT NOT NULL CHECK (instrument IN ('piano', 'guitarra', 'bajo', 'bateria', 'violin', 'flauta', 'saxofon', 'trompeta', 'trombon')),
  exercise_name TEXT NOT NULL,
  exercise_description TEXT,
  sheet_music_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  tempo INTEGER,
  key_signature TEXT,
  duration_minutes INTEGER,
  target_techniques TEXT[],
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  practice_score INTEGER CHECK (practice_score BETWEEN 1 AND 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para entrenamiento de danzas
CREATE TABLE public.dance_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dance_style TEXT NOT NULL CHECK (dance_style IN ('liturgica', 'israelita', 'contemporanea', 'folclorica', 'adoracion')),
  routine_name TEXT NOT NULL,
  routine_description TEXT,
  video_url TEXT,
  music_url TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  duration_minutes INTEGER,
  target_movements TEXT[],
  formation_type TEXT CHECK (formation_type IN ('individual', 'pareja', 'grupo_pequeno', 'grupo_grande')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  performance_score INTEGER CHECK (performance_score BETWEEN 1 AND 100),
  instructor_feedback TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para asistente personal y gastos
CREATE TABLE public.personal_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('ingreso', 'gasto', 'ahorro', 'meta')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('diario', 'semanal', 'quincenal', 'mensual', 'anual')),
  encrypted_notes TEXT, -- Para datos sensibles encriptados
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para configuración del asistente personal
CREATE TABLE public.personal_assistant_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  voice_commands_enabled BOOLEAN DEFAULT true,
  preferred_voice TEXT DEFAULT 'alloy',
  expense_categories TEXT[] DEFAULT ARRAY['alimentacion', 'transporte', 'servicios', 'entretenimiento', 'salud', 'educacion', 'otros'],
  monthly_budget DECIMAL(10,2),
  savings_goal DECIMAL(10,2),
  reminder_preferences JSONB DEFAULT '{"expenses": true, "budget": true, "savings": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para seguimiento de progreso
CREATE TABLE public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('vocal', 'musical', 'dance')),
  training_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_duration_minutes INTEGER,
  performance_score INTEGER CHECK (performance_score BETWEEN 1 AND 100),
  strengths TEXT[],
  areas_to_improve TEXT[],
  instructor_notes TEXT,
  user_reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.vocal_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assistant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vocal_training
CREATE POLICY "Users can view their vocal training" 
ON public.vocal_training 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their vocal training" 
ON public.vocal_training 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their vocal training" 
ON public.vocal_training 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vocal training" 
ON public.vocal_training 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator'));

-- Políticas RLS para instrument_training
CREATE POLICY "Users can view their instrument training" 
ON public.instrument_training 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their instrument training" 
ON public.instrument_training 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their instrument training" 
ON public.instrument_training 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all instrument training" 
ON public.instrument_training 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator'));

-- Políticas RLS para dance_training
CREATE POLICY "Users can view their dance training" 
ON public.dance_training 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their dance training" 
ON public.dance_training 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their dance training" 
ON public.dance_training 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dance training" 
ON public.dance_training 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator'));

-- Políticas RLS para personal_expenses (completamente privadas)
CREATE POLICY "Users can only access their own expenses" 
ON public.personal_expenses 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para personal_assistant_config
CREATE POLICY "Users can manage their assistant config" 
ON public.personal_assistant_config 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para training_progress
CREATE POLICY "Users can view their training progress" 
ON public.training_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their training progress" 
ON public.training_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all training progress" 
ON public.training_progress 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator'));

-- Triggers para updated_at
CREATE TRIGGER update_vocal_training_updated_at
  BEFORE UPDATE ON public.vocal_training
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_instrument_training_updated_at
  BEFORE UPDATE ON public.instrument_training
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dance_training_updated_at
  BEFORE UPDATE ON public.dance_training
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_personal_expenses_updated_at
  BEFORE UPDATE ON public.personal_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_personal_assistant_config_updated_at
  BEFORE UPDATE ON public.personal_assistant_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();