import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Importar LocalNotifications dinámicamente
let LocalNotifications: any = null;

try {
  import("@capacitor/local-notifications")
    .then((module) => {
      LocalNotifications = module.LocalNotifications;
      console.log("📱 [NativeSync] LocalNotifications loaded");
    })
    .catch(() => {
      console.log("📱 [NativeSync] LocalNotifications not available");
    });
} catch (e) {
  console.log("📱 [NativeSync] Capacitor not available");
}

// Helper para detectar plataforma nativa
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();
};

interface SystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: number;
  notification_category: string | null;
  metadata: any;
  created_at: string;
  recipient_id: string | null;
  is_read: boolean;
}

// Tipos de notificación que deben mostrar overlay
const overlayTypes = [
  "service_overlay",
  "daily_verse",
  "daily_advice",
  "death_announcement",
  "meeting_announcement",
  "special_service",
  "prayer_request",
  "blood_donation",
  "extraordinary_rehearsal",
  "ministry_instructions",
  "birthday",
  "birthday_daily",
  "pregnancy_reveal",
  "birth_announcement",
  "director_change",
  "special_event",
  "general_announcement",
  "voice_replacement",
  "womens_day",
];

// Función helper para generar hash numérico de un string (ID para notificaciones nativas)
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2147483647;
}

export const useNativeNotificationSync = () => {
  const { user } = useAuth();
  const syncedNotificationsRef = useRef<Set<string>>(new Set());
  const lastNotificationTimeRef = useRef<number>(0);
  const notificationCooldown = 2000; // 2 segundos entre notificaciones

  // Verificar si el dispositivo tiene token APNS registrado
  const checkApnsToken = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("user_devices")
        .select("device_token")
        .eq("user_id", user.id)
        .eq("platform", "ios")
        .eq("is_active", true)
        .limit(1);

      if (error) {
        console.error("❌ [NativeSync] Error checking APNS token:", error);
        return false;
      }

      return data && data.length > 0 && !!data[0].device_token;
    } catch (error) {
      console.error("❌ [NativeSync] Error checking APNS token:", error);
      return false;
    }
  }, [user]);

  // Función para mostrar notificación local nativa (solo para notificaciones push fallback)
  const showNativeNotification = useCallback(
    async (notification: SystemNotification) => {
      // Verificar si tenemos token APNS activo
      const hasApnsToken = await checkApnsToken();

      // Si tenemos token APNS, NO mostrar notificación local
      // El trigger de Supabase ya envió la notificación push
      if (hasApnsToken) {
        console.log("📱 [NativeSync] APNS token available, skipping local notification");
        return;
      }

      if (!isNativePlatform() || !LocalNotifications) {
        console.log("📱 [NativeSync] Not on native platform or LocalNotifications not available");
        return;
      }

      // Evitar duplicados
      if (syncedNotificationsRef.current.has(notification.id)) {
        console.log("📱 [NativeSync] Notification already synced:", notification.id);
        return;
      }

      // Evitar notificaciones demasiado seguidas
      const now = Date.now();
      if (now - lastNotificationTimeRef.current < notificationCooldown) {
        console.log("📱 [NativeSync] Notification cooldown active, skipping:", notification.id);
        return;
      }

      try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== "granted") {
          console.log("📱 [NativeSync] Permission not granted, requesting...");
          const requestResult = await LocalNotifications.requestPermissions();
          if (requestResult.display !== "granted") {
            console.log("📱 [NativeSync] Permission denied");
            return;
          }
        }

        const notificationId = hashCode(notification.id);
        const showOverlay = overlayTypes.includes(notification.type);

        console.log(`📱 [NativeSync] Scheduling local notification: ${notification.title}`);

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: notification.title,
              body: notification.message,
              schedule: { at: new Date(Date.now() + 100) },
              sound: "notification.wav",
              smallIcon: "ic_arcana_notification",
              largeIcon: "ic_arcana_notification",
              extra: {
                notificationId: notification.id,
                type: notification.type,
                showOverlay: showOverlay,
                metadata: notification.metadata,
                title: notification.title,
                message: notification.message,
              },
              threadIdentifier: `arcana-${notification.type}`,
              relevanceScore: notification.priority === 3 ? 1.0 : 0.5,
              actionTypeId: showOverlay ? "OPEN_OVERLAY" : "DEFAULT",
            },
          ],
        });

        syncedNotificationsRef.current.add(notification.id);
        lastNotificationTimeRef.current = now;
        console.log(`✅ [NativeSync] Local notification scheduled: ${notification.title}`);
      } catch (error) {
        console.error("❌ [NativeSync] Error showing native notification:", error);
      }
    },
    [checkApnsToken],
  );

  // Función para eliminar notificación nativa cuando se marca como leída
  const removeNativeNotification = useCallback(async (notificationId: string) => {
    if (!isNativePlatform() || !LocalNotifications) return;

    try {
      const nativeId = hashCode(notificationId);
      await LocalNotifications.cancel({ notifications: [{ id: nativeId }] });
      syncedNotificationsRef.current.delete(notificationId);
      console.log(`🗑️ [NativeSync] Removed native notification: ${notificationId}`);
    } catch (error) {
      console.error("❌ [NativeSync] Error removing native notification:", error);
    }
  }, []);

  // Marcar notificación como leída cuando el usuario interactúa con ella
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("system_notifications")
          .update({ is_read: true })
          .eq("id", notificationId);

        if (error) {
          console.error("❌ [NativeSync] Error marking as read:", error);
        } else {
          console.log("✅ [NativeSync] Marked as read:", notificationId);
        }
      } catch (error) {
        console.error("❌ [NativeSync] Error marking notification as read:", error);
      }
    },
    [user],
  );

  // Cargar notificaciones no leídas al iniciar (solo para dispositivos sin APNS)
  useEffect(() => {
    if (!user || !isNativePlatform()) return;

    const loadUnreadNotifications = async () => {
      // Verificar si tenemos APNS token
      const hasApnsToken = await checkApnsToken();
      if (hasApnsToken) {
        console.log("📱 [NativeSync] APNS token available, skipping unread notification loading");
        return;
      }

      console.log("📱 [NativeSync] Loading unread notifications (no APNS token)...");

      try {
        const { data: notifications, error } = await supabase
          .from("system_notifications")
          .select("*")
          .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error("❌ [NativeSync] Error loading notifications:", error);
          return;
        }

        console.log(`📱 [NativeSync] Found ${notifications?.length || 0} unread notifications`);

        // Mostrar cada notificación no leída como nativa (solo si no hay APNS)
        for (const notification of notifications || []) {
          await showNativeNotification(notification as SystemNotification);
        }
      } catch (error) {
        console.error("❌ [NativeSync] Error in loadUnreadNotifications:", error);
      }
    };

    // Esperar a que LocalNotifications esté disponible
    const checkAndLoad = () => {
      if (LocalNotifications) {
        loadUnreadNotifications();
      } else {
        setTimeout(checkAndLoad, 500);
      }
    };

    checkAndLoad();
  }, [user, showNativeNotification, checkApnsToken]);

  // Configurar listeners para notificaciones locales (solo para fallback)
  useEffect(() => {
    if (!isNativePlatform() || !LocalNotifications) return;

    const setupListeners = async () => {
      await LocalNotifications.addListener("localNotificationActionPerformed", (action: any) => {
        console.log("📱 [NativeSync] Notification action performed:", action);

        const extra = action.notification?.extra || {};

        // Marcar como leída en la base de datos
        if (extra.notificationId) {
          markNotificationAsRead(extra.notificationId);
        }

        if (extra.showOverlay && extra.type) {
          window.dispatchEvent(
            new CustomEvent("showOverlay", {
              detail: {
                id: `notification-click-${extra.notificationId || Date.now()}`,
                type: extra.type,
                title: extra.title || "",
                message: extra.message || "",
                metadata: extra.metadata || {},
              },
            }),
          );
        }
      });

      console.log("📱 [NativeSync] Local notification listeners configured");
    };

    setupListeners();

    return () => {
      if (LocalNotifications) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, [markNotificationAsRead]);

  // Suscribirse a cambios en system_notifications (INSERT y UPDATE)
  useEffect(() => {
    if (!user) {
      console.log("📱 [NativeSync] No user, skipping subscription");
      return;
    }

    console.log("📱 [NativeSync] Setting up realtime subscription for user:", user.id);

    const channel = supabase
      .channel("native-notification-sync")
      // Escuchar nuevas notificaciones
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_notifications",
        },
        async (payload) => {
          console.log("📱 [NativeSync] New notification received:", payload);

          const notification = payload.new as SystemNotification;

          if (notification.recipient_id !== null && notification.recipient_id !== user.id) {
            console.log("📱 [NativeSync] Notification not for this user, ignoring");
            return;
          }

          // Verificar si tenemos APNS token
          const hasApnsToken = await checkApnsToken();

          if (hasApnsToken) {
            console.log("📱 [NativeSync] APNS token available, trigger will send push notification");
            // No mostrar notificación local, el trigger de Supabase manejará el push
          } else {
            console.log("📱 [NativeSync] No APNS token, showing local notification");
            await showNativeNotification(notification);
          }
        },
      )
      // Escuchar cuando se marcan como leídas
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "system_notifications",
        },
        async (payload) => {
          const notification = payload.new as SystemNotification;

          // Si se marcó como leída, eliminar la notificación nativa (solo si existe localmente)
          if (notification.is_read) {
            console.log("📱 [NativeSync] Notification marked as read:", notification.id);
            await removeNativeNotification(notification.id);
          }
        },
      )
      .subscribe((status) => {
        console.log("📱 [NativeSync] Subscription status:", status);
      });

    return () => {
      console.log("📱 [NativeSync] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [user, showNativeNotification, removeNativeNotification, checkApnsToken]);

  return {
    showNativeNotification,
    removeNativeNotification,
    markNotificationAsRead,
  };
};

export default useNativeNotificationSync;
