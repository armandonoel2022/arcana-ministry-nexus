-- Approve and configure Roosevelt Martinez account
UPDATE public.profiles 
SET 
  is_approved = true,
  needs_password_change = false,
  role = 'leader',
  full_name = 'Roosevelt Martínez',
  approved_by = '77d3bf2c-c778-48f7-9353-50dfb7bb19b0',
  approved_at = NOW()
WHERE id = '99efcf93-c302-4e42-b63f-6b697f8baa38';