-- Add microphone order field to group_members table
ALTER TABLE public.group_members 
ADD COLUMN mic_order integer;

-- Add index for efficient ordering
CREATE INDEX idx_group_members_mic_order ON public.group_members(group_id, mic_order) WHERE is_active = true;