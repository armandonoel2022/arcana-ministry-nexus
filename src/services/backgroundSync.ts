// Background Sync Service - Pre-caches all critical data when online
import { supabase } from '@/integrations/supabase/client';
import { offlineCache, CACHE_KEYS } from '@/services/offlineCacheService';

// All data fetchers for background sync
const DATA_FETCHERS: Record<string, () => Promise<any>> = {
  [CACHE_KEYS.SERVICES]: async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*, worship_groups(*)')
      .order('service_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.SONGS]: async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_active', true)
      .order('title');
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.MEMBERS]: async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('nombres');
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.USER_PROFILE]: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.WORSHIP_GROUPS]: async () => {
    const { data, error } = await supabase
      .from('worship_groups')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.GROUP_MEMBERS]: async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, worship_groups(*), members(*)');
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.DAILY_VERSES]: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_verses')
      .select('*, bible_verses(*)')
      .eq('date', today)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  [CACHE_KEYS.DAILY_ADVICE]: async () => {
    const { data, error } = await supabase
      .from('daily_advice')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.CHAT_ROOMS]: async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  [CACHE_KEYS.SPECIAL_EVENTS]: async () => {
    const { data, error } = await supabase
      .from('special_events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date');
    if (error) throw error;
    return data || [];
  },
};

let isSyncing = false;

export async function syncAllData(): Promise<{ success: number; failed: number }> {
  if (isSyncing || !navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  isSyncing = true;
  let success = 0;
  let failed = 0;

  console.log('🔄 [BackgroundSync] Iniciando sincronización de datos...');

  const entries = Object.entries(DATA_FETCHERS);
  
  // Sync in parallel batches of 3 to avoid overwhelming the network
  for (let i = 0; i < entries.length; i += 3) {
    const batch = entries.slice(i, i + 3);
    const results = await Promise.allSettled(
      batch.map(async ([key, fetcher]) => {
        try {
          const data = await fetcher();
          offlineCache.set(key, data);
          console.log(`✅ [BackgroundSync] ${key} sincronizado`);
          return true;
        } catch (err) {
          console.warn(`⚠️ [BackgroundSync] Error sincronizando ${key}:`, err);
          throw err;
        }
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') success++;
      else failed++;
    });
  }

  localStorage.setItem('arcana_last_full_sync', new Date().toISOString());
  console.log(`🔄 [BackgroundSync] Completado: ${success} exitosos, ${failed} fallidos`);
  isSyncing = false;
  return { success, failed };
}

// Check if a full sync is needed (older than 30 minutes)
export function needsSync(): boolean {
  const lastSync = localStorage.getItem('arcana_last_full_sync');
  if (!lastSync) return true;
  const elapsed = Date.now() - new Date(lastSync).getTime();
  return elapsed > 30 * 60 * 1000; // 30 minutes
}

// Get last sync time
export function getLastSyncTime(): Date | null {
  const raw = localStorage.getItem('arcana_last_full_sync');
  return raw ? new Date(raw) : null;
}
