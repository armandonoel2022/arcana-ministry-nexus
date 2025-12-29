-- Corregir función update_frequent_contact con search_path
CREATE OR REPLACE FUNCTION public.update_frequent_contact()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.frequent_contacts (user_id, contact_id, interaction_count, last_interaction_at)
  VALUES (NEW.sender_id, NEW.receiver_id, 1, now())
  ON CONFLICT (user_id, contact_id) 
  DO UPDATE SET 
    interaction_count = public.frequent_contacts.interaction_count + 1,
    last_interaction_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;