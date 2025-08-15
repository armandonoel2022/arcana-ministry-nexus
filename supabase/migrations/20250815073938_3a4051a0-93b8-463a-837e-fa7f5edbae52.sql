-- Create table for user musical training configuration
CREATE TABLE IF NOT EXISTS public.user_musical_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instrument TEXT NOT NULL,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  weekly_goal INTEGER NOT NULL DEFAULT 5,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, instrument)
);

-- Enable Row Level Security
ALTER TABLE public.user_musical_training ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own musical training config" 
ON public.user_musical_training 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own musical training config" 
ON public.user_musical_training 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own musical training config" 
ON public.user_musical_training 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own musical training config" 
ON public.user_musical_training 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates using existing function
CREATE TRIGGER update_user_musical_training_updated_at
BEFORE UPDATE ON public.user_musical_training
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();