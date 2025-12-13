import { useState, useEffect, useCallback } from 'react';
import { offlineCache, fetchWithCache, CACHE_KEYS } from '@/services/offlineCacheService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook for monitoring online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(offlineCache.getOnlineStatus());

  useEffect(() => {
    const unsubscribe = offlineCache.onNetworkChange((online) => {
      setIsOnline(online);
      if (online) {
        toast.success('Conexión restaurada', { duration: 2000 });
      } else {
        toast.warning('Sin conexión - usando datos guardados', { duration: 3000 });
      }
    });

    return unsubscribe;
  }, []);

  return isOnline;
}

// Hook for cached services (Agenda Ministerial)
export function useCachedServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const fetchServices = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await fetchWithCache(
        CACHE_KEYS.SERVICES,
        async () => {
          const { data, error } = await supabase
            .from('services')
            .select('*, worship_groups(*)')
            .order('service_date', { ascending: true });
          
          if (error) throw error;
          return data || [];
        },
        {
          forceRefresh,
          onStaleData: (staleData) => {
            setServices(staleData);
            setIsStale(true);
          }
        }
      );
      setServices(data);
      setIsStale(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Try to get any cached data
      const cached = offlineCache.get<any[]>(CACHE_KEYS.SERVICES);
      if (cached) {
        setServices(cached);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Refresh when coming back online
  useEffect(() => {
    if (isOnline && isStale) {
      fetchServices(true);
    }
  }, [isOnline, isStale, fetchServices]);

  return { services, loading, isStale, refresh: () => fetchServices(true) };
}

// Hook for cached songs (Repertorio Musical)
export function useCachedSongs() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const fetchSongs = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await fetchWithCache(
        CACHE_KEYS.SONGS,
        async () => {
          const { data, error } = await supabase
            .from('songs')
            .select('*')
            .eq('is_active', true)
            .order('title');
          
          if (error) throw error;
          return data || [];
        },
        {
          forceRefresh,
          onStaleData: (staleData) => {
            setSongs(staleData);
            setIsStale(true);
          }
        }
      );
      setSongs(data);
      setIsStale(false);
    } catch (error) {
      console.error('Error fetching songs:', error);
      const cached = offlineCache.get<any[]>(CACHE_KEYS.SONGS);
      if (cached) {
        setSongs(cached);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    if (isOnline && isStale) {
      fetchSongs(true);
    }
  }, [isOnline, isStale, fetchSongs]);

  return { songs, loading, isStale, refresh: () => fetchSongs(true) };
}

// Hook for cached members
export function useCachedMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const fetchMembers = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await fetchWithCache(
        CACHE_KEYS.MEMBERS,
        async () => {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('is_active', true)
            .order('nombres');
          
          if (error) throw error;
          return data || [];
        },
        {
          forceRefresh,
          onStaleData: (staleData) => {
            setMembers(staleData);
            setIsStale(true);
          }
        }
      );
      setMembers(data);
      setIsStale(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      const cached = offlineCache.get<any[]>(CACHE_KEYS.MEMBERS);
      if (cached) {
        setMembers(cached);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (isOnline && isStale) {
      fetchMembers(true);
    }
  }, [isOnline, isStale, fetchMembers]);

  return { members, loading, isStale, refresh: () => fetchMembers(true) };
}

// Hook for cached profiles
export function useCachedProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const fetchProfiles = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await fetchWithCache(
        CACHE_KEYS.USER_PROFILE,
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_active', true)
            .order('full_name');
          
          if (error) throw error;
          return data || [];
        },
        {
          forceRefresh,
          onStaleData: (staleData) => {
            setProfiles(staleData);
            setIsStale(true);
          }
        }
      );
      setProfiles(data);
      setIsStale(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      const cached = offlineCache.get<any[]>(CACHE_KEYS.USER_PROFILE);
      if (cached) {
        setProfiles(cached);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (isOnline && isStale) {
      fetchProfiles(true);
    }
  }, [isOnline, isStale, fetchProfiles]);

  return { profiles, loading, isStale, refresh: () => fetchProfiles(true) };
}

// Hook for cached worship groups
export function useCachedWorshipGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const fetchGroups = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await fetchWithCache(
        CACHE_KEYS.WORSHIP_GROUPS,
        async () => {
          const { data, error } = await supabase
            .from('worship_groups')
            .select('*')
            .eq('is_active', true)
            .order('name');
          
          if (error) throw error;
          return data || [];
        },
        {
          forceRefresh,
          onStaleData: (staleData) => {
            setGroups(staleData);
            setIsStale(true);
          }
        }
      );
      setGroups(data);
      setIsStale(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      const cached = offlineCache.get<any[]>(CACHE_KEYS.WORSHIP_GROUPS);
      if (cached) {
        setGroups(cached);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (isOnline && isStale) {
      fetchGroups(true);
    }
  }, [isOnline, isStale, fetchGroups]);

  return { groups, loading, isStale, refresh: () => fetchGroups(true) };
}

// Generic hook for any cached data
export function useCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isOnline = useOnlineStatus();

  const fetch = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithCache(
        cacheKey,
        fetchFn,
        {
          forceRefresh,
          onStaleData: (staleData) => {
            setData(staleData);
            setIsStale(true);
          }
        }
      );
      setData(result);
      setIsStale(false);
    } catch (err) {
      console.error(`Error fetching ${cacheKey}:`, err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      
      const cached = offlineCache.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ...dependencies]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (isOnline && isStale) {
      fetch(true);
    }
  }, [isOnline, isStale, fetch]);

  return { 
    data, 
    loading, 
    isStale, 
    error,
    isOnline,
    refresh: () => fetch(true) 
  };
}

export default useOnlineStatus;
