import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('system_notifications')
          .select('id', { count: 'exact' })
          .eq('is_read', false);

        if (error) {
          console.error('Error fetching unread notifications:', error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
      }
    };

    fetchUnreadCount();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_notifications'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadCount;
};