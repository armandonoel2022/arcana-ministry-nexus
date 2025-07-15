-- Enable users to manage group memberships
CREATE POLICY "Users can insert group members" ON public.group_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update group members" ON public.group_members FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete group members" ON public.group_members FOR DELETE USING (auth.uid() IS NOT NULL);