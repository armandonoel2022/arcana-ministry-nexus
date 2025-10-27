-- Add photo_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;