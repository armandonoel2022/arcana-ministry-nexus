-- Assign current user as admin (this needs to be done by an admin, so we do it via migration)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('77d3bf2c-c778-48f7-9353-50dfb7bb19b0', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix the trigger function to have search_path
CREATE OR REPLACE FUNCTION update_screen_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;