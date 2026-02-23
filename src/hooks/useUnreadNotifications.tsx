import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Contar notificaciones personales (recipient_id = user.id) Y broadcast (recipient_id IS NULL)
        const { count, error } = await supabase
          .from("system_notifications")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false)
          .or(`recipient_id.eq.${user.id},recipient_id.is.null`);

        if (error) {
          console.error("Error fetching unread notifications:", error);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error in fetchUnreadCount:", error);
      }
    };

    fetchUnreadCount();

    // Suscribirse a cambios en tiempo real - notificaciones personales Y broadcast
    const channel = supabase
      .channel(`notifications-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_notifications",
          filter: `recipient_id=is.null`,
        },
        () => {
          fetchUnreadCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
};
