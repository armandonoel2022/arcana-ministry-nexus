import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Invoca el edge function send-scheduled-notifications cada minuto.
 * Solución ligera hasta que se configure pg_cron en Supabase.
 */
export function useScheduledNotificationsInvoker() {
  const lastMinuteRef = useRef<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const invoke = async () => {
      try {
        await supabase.functions.invoke('send-scheduled-notifications');
      } catch (e) {
        console.warn('send-scheduled-notifications invocation failed', e);
      }
    };

    const tick = () => {
      const now = new Date();
      const minuteKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
      if (lastMinuteRef.current !== minuteKey) {
        lastMinuteRef.current = minuteKey;
        invoke();
      }
    };

    // Llamada inmediata y luego cada 15s para no perder el minuto exacto
    invoke();
    timer = window.setInterval(tick, 15000);

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, []);
}
