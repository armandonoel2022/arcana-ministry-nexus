-- Update RLS policies for group_members to allow viewing members with their details
-- First, let's add a policy to allow authenticated users to manage group members
CREATE POLICY "Authenticated users can manage group members" 
ON public.group_members 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Also update the worship_groups table to allow authenticated users to manage groups
CREATE POLICY "Authenticated users can manage worship groups" 
ON public.worship_groups 
FOR ALL 
USING (auth.uid() IS NOT NULL);