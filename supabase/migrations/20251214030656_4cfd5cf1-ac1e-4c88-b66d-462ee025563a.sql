-- Allow administrators to insert chat room members
CREATE POLICY "Administrators can insert chat room members"
ON public.chat_room_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'administrator'
  )
);

-- Allow administrators to delete chat room members
CREATE POLICY "Administrators can delete chat room members"
ON public.chat_room_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'administrator'
  )
);

-- Allow administrators to update chat room members
CREATE POLICY "Administrators can update chat room members"
ON public.chat_room_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'administrator'
  )
);