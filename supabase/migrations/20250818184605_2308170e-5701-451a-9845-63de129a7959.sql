-- Add user approval system and temporary passwords
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS needs_password_change boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Create table for password reset requests
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  requested_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  admin_notified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval)
);

-- Enable RLS on password reset requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for password reset requests
CREATE POLICY "Users can create password reset requests" 
ON public.password_reset_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all password reset requests" 
ON public.password_reset_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  )
);

CREATE POLICY "Admins can update password reset requests" 
ON public.password_reset_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  )
);

-- Update profiles policies to include approval system
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id AND 
  (is_approved = true OR role = 'administrator')
);

-- Policy for admins to approve users
CREATE POLICY "Admins can approve users" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  )
);

-- Update handle_new_user function to set approval status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    is_approved, 
    needs_password_change,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    false,  -- New users need approval
    true,   -- New users need to change password
    'member'::user_role
  );
  RETURN NEW;
END;
$$;