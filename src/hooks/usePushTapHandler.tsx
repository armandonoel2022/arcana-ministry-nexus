import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_TITLES: Record<string, string> = {
  daily_verse: 'Versículo del Día',
  daily_advice: 'Consejo del Día',
  service_overlay: 'Programa de Servicios',
};

// Opens the matching in-app overlay when the user taps a native notification.
// The push only carries the type, so the full content is loaded from system_notifications.
async function openOverlayFromTap(raw: any) {
  const data = raw?.notification?.data || raw?.notification?.extra || {};
  const type: string | undefined = data.type;
  if (!type) return;

  let title = data.title || DEFAULT_TITLES[type] || '';
  let message = data.message || raw?.notification?.body || '';
  let metadata: Record<string, unknown> = data.metadata || {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: row } = await supabase
        .from('system_notifications')
        .select('id, title, message, metadata')
        .eq('recipient_id', session.user.id)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (row) {
        title = row.title || title;
        message = row.message || message;
        metadata = (row.metadata as Record<string, unknown>) || metadata;
        supabase.from('system_notifications').update({ is_read: true }).eq('id', row.id).then(() => {});
      }
    }
  } catch (e) {
    console.error('📱 [PushTap] Could not load notification content', e);
  }

  const detail = { id: `notification-click-${Date.now()}`, type, title, message, metadata };
  // Give the overlay manager time to mount when the app was cold-launched by the tap
  const dispatch = () => window.dispatchEvent(new CustomEvent('showOverlay', { detail }));
  setTimeout(dispatch, 1500);
}

export function usePushTapHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handles: { remove: () => void }[] = [];
    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        handles.push(await PushNotifications.addListener('pushNotificationActionPerformed', openOverlayFromTap));
      } catch (e) {
        console.error('📱 [PushTap] push listener failed', e);
      }
    })();
    return () => handles.forEach(h => h.remove());
  }, []);
}
