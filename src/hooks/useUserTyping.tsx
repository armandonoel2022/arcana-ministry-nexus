import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UserTypingInfo {
  userId: string;
  fullName: string;
  photoUrl: string | null;
}

/**
 * Hook para obtener información del usuario que está escribiendo
 * Incluye foto del usuario desde members.photo_url
 */
export const useUserTyping = (userId: string | null) => {
  const [userInfo, setUserInfo] = useState<UserTypingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUserInfo(null);
      return;
    }

    const fetchUserInfo = async () => {
      setIsLoading(true);
      try {
        // Primero buscar en profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url')
          .eq('id', userId)
          .single();

        if (profile) {
          // Si no tiene foto en profile, buscar en members
          let photoUrl = profile.photo_url;
          
          if (!photoUrl) {
            const { data: member } = await supabase
              .from('members')
              .select('photo_url')
              .ilike('nombres', `%${profile.full_name.split(' ')[0]}%`)
              .single();

            photoUrl = member?.photo_url || null;
          }

          setUserInfo({
            userId: profile.id,
            fullName: profile.full_name,
            photoUrl
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  return { userInfo, isLoading };
};
