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
        const { data, error } = await supabase
          .from("system_notifications")
          .select("id", { count: "exact" })
          .eq("is_read", false)
          .eq("recipient_id", user.id);

        if (error) {
          console.error("Error fetching unread notifications:", error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error("Error in fetchUnreadCount:", error);
      }
    };

    fetchUnreadCount();

    // Suscribirse a cambios en tiempo real - solo para este usuario
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
};
