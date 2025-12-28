import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cache keys for different data types
const CACHE_KEYS = {
  SERVICES: 'arcana_offline_services',
  SONGS: 'arcana_offline_songs',
  MEMBERS: 'arcana_offline_members',
  PROFILES: 'arcana_offline_profiles',
  WORSHIP_GROUPS: 'arcana_offline_worship_groups',
  DAILY_VERSE: 'arcana_offline_daily_verse',
  DAILY_ADVICE: 'arcana_offline_daily_advice',
  LAST_SYNC: 'arcana_offline_last_sync',
};

// How long data is considered fresh (5 minutes)
const STALE_TIME = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexión - Modo offline activado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Generic hook for offline data with automatic sync
export function useOfflineData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T | null>,
  options?: {
    syncOnMount?: boolean;
    syncOnReconnect?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const isOnline = useOnlineStatus();

  // Load from cache
  const loadFromCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        const age = Date.now() - entry.timestamp;
        setIsStale(age > STALE_TIME);
        setLastSync(new Date(entry.timestamp));
        return entry.data;
      }
    } catch (error) {
      console.error(`Error loading ${cacheKey} from cache:`, error);
    }
    return null;
  }, [cacheKey]);

  // Save to cache
  const saveToCache = useCallback((newData: T) => {
    try {
      const entry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      setLastSync(new Date());
      setIsStale(false);
    } catch (error) {
      console.error(`Error saving ${cacheKey} to cache:`, error);
    }
  }, [cacheKey]);

  // Fetch fresh data
  const refresh = useCallback(async () => {
    if (!isOnline) {
      console.log(`Cannot refresh ${cacheKey} - offline`);
      return;
    }

    setIsLoading(true);
    try {
      const freshData = await fetchFn();
      if (freshData !== null) {
        setData(freshData);
        saveToCache(freshData);
      }
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error);
      // Keep cached data
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, cacheKey, fetchFn, saveToCache]);

  // Initial load
  useEffect(() => {
    const cachedData = loadFromCache();
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
    }

    if (options?.syncOnMount !== false && isOnline) {
      refresh();
    } else if (!cachedData) {
      setIsLoading(false);
    }
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && options?.syncOnReconnect !== false && isStale) {
      refresh();
    }
  }, [isOnline, isStale, options?.syncOnReconnect, refresh]);

  return {
    data,
    isLoading,
    isStale,
    isOnline,
    lastSync,
    refresh,
    setData,
  };
}

// Pre-built hooks for common data types
export function useOfflineServices() {
  return useOfflineData(CACHE_KEYS.SERVICES, async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .gte('service_date', new Date().toISOString().split('T')[0])
      .order('service_date', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    return data;
  });
}

export function useOfflineSongs() {
  return useOfflineData(CACHE_KEYS.SONGS, async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_active', true)
      .order('title', { ascending: true });
    
    if (error) throw error;
    return data;
  });
}

export function useOfflineMembers() {
  return useOfflineData(CACHE_KEYS.MEMBERS, async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('nombres', { ascending: true });
    
    if (error) throw error;
    return data;
  });
}

export function useOfflineProfiles() {
  return useOfflineData(CACHE_KEYS.PROFILES, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return data;
  });
}

export function useOfflineWorshipGroups() {
  return useOfflineData(CACHE_KEYS.WORSHIP_GROUPS, async () => {
    const { data, error } = await supabase
      .from('worship_groups')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  });
}

// Sync all offline data at once
export async function syncAllOfflineData() {
  const syncPromises = [
    CACHE_KEYS.SERVICES,
    CACHE_KEYS.SONGS,
    CACHE_KEYS.MEMBERS,
    CACHE_KEYS.PROFILES,
    CACHE_KEYS.WORSHIP_GROUPS,
  ].map(async (key) => {
    // This will trigger the individual hooks to refresh
    localStorage.setItem(`${key}_needs_sync`, 'true');
  });

  await Promise.all(syncPromises);
  localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
}

// Get last sync time
export function getLastSyncTime(): Date | null {
  const lastSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
  return lastSync ? new Date(lastSync) : null;
}

// Clear all offline cache
export function clearOfflineCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_needs_sync`);
  });
}
