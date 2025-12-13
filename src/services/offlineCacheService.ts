// Offline Cache Service - Manages local storage for offline functionality

const CACHE_PREFIX = 'arcana_cache_';
const CACHE_TIMESTAMP_SUFFIX = '_timestamp';
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheConfig {
  key: string;
  duration?: number; // in milliseconds
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0.0';

// List of cacheable data keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  SERVICES: 'services',
  SONGS: 'songs',
  MEMBERS: 'members',
  WORSHIP_GROUPS: 'worship_groups',
  GROUP_MEMBERS: 'group_members',
  DAILY_VERSES: 'daily_verses',
  DAILY_ADVICE: 'daily_advice',
  PENDING_NOTIFICATIONS: 'pending_notifications',
  CHAT_ROOMS: 'chat_rooms',
  RECENT_MESSAGES: 'recent_messages',
  SPECIAL_EVENTS: 'special_events',
} as const;

// Cache duration per key (some data needs fresher updates)
const CACHE_DURATIONS: Record<string, number> = {
  [CACHE_KEYS.USER_PROFILE]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [CACHE_KEYS.SERVICES]: 1 * 60 * 60 * 1000, // 1 hour
  [CACHE_KEYS.SONGS]: 24 * 60 * 60 * 1000, // 24 hours
  [CACHE_KEYS.MEMBERS]: 24 * 60 * 60 * 1000, // 24 hours
  [CACHE_KEYS.WORSHIP_GROUPS]: 24 * 60 * 60 * 1000, // 24 hours
  [CACHE_KEYS.GROUP_MEMBERS]: 24 * 60 * 60 * 1000, // 24 hours
  [CACHE_KEYS.DAILY_VERSES]: 12 * 60 * 60 * 1000, // 12 hours
  [CACHE_KEYS.DAILY_ADVICE]: 12 * 60 * 60 * 1000, // 12 hours
  [CACHE_KEYS.PENDING_NOTIFICATIONS]: 5 * 60 * 1000, // 5 minutes
  [CACHE_KEYS.CHAT_ROOMS]: 1 * 60 * 60 * 1000, // 1 hour
  [CACHE_KEYS.RECENT_MESSAGES]: 15 * 60 * 1000, // 15 minutes
  [CACHE_KEYS.SPECIAL_EVENTS]: 1 * 60 * 60 * 1000, // 1 hour
};

class OfflineCacheService {
  private isOnline: boolean = navigator.onLine;
  private onlineListeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 [OfflineCache] Conexión restaurada');
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 [OfflineCache] Sin conexión - usando caché');
      this.notifyListeners(false);
    });
  }

  private notifyListeners(isOnline: boolean) {
    this.onlineListeners.forEach(listener => listener(isOnline));
  }

  // Subscribe to online/offline changes
  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineListeners.add(callback);
    return () => this.onlineListeners.delete(callback);
  }

  // Check if we're online
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Save data to cache
  set<T>(key: string, data: T): void {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
      console.log(`💾 [OfflineCache] Guardado: ${key}`);
    } catch (error) {
      console.error(`Error guardando caché ${key}:`, error);
      // If storage is full, try to clear old cache
      this.clearExpiredCache();
    }
  }

  // Get data from cache
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;

      const cached: CachedData<T> = JSON.parse(raw);
      
      // Check version compatibility
      if (cached.version !== CACHE_VERSION) {
        this.remove(key);
        return null;
      }

      // Check if cache is expired
      const duration = CACHE_DURATIONS[key] || DEFAULT_CACHE_DURATION;
      if (Date.now() - cached.timestamp > duration) {
        console.log(`⏰ [OfflineCache] Expirado: ${key}`);
        // Don't remove - keep stale data for offline use
        // Just return it with a flag that it might be stale
      }

      return cached.data;
    } catch (error) {
      console.error(`Error leyendo caché ${key}:`, error);
      return null;
    }
  }

  // Get data with freshness info
  getWithMeta<T>(key: string): { data: T | null; isStale: boolean; timestamp: number | null } {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return { data: null, isStale: true, timestamp: null };

      const cached: CachedData<T> = JSON.parse(raw);
      const duration = CACHE_DURATIONS[key] || DEFAULT_CACHE_DURATION;
      const isStale = Date.now() - cached.timestamp > duration;

      return {
        data: cached.data,
        isStale,
        timestamp: cached.timestamp,
      };
    } catch (error) {
      return { data: null, isStale: true, timestamp: null };
    }
  }

  // Remove specific key
  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  // Clear all cache
  clearAll(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    console.log('🗑️ [OfflineCache] Caché limpiado');
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          
          const cached = JSON.parse(raw);
          const cacheKey = key.replace(CACHE_PREFIX, '');
          const duration = CACHE_DURATIONS[cacheKey] || DEFAULT_CACHE_DURATION;
          
          // Remove if older than 2x duration
          if (Date.now() - cached.timestamp > duration * 2) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
  }

  // Get cache size info
  getCacheInfo(): { usedSpace: number; itemCount: number } {
    let usedSpace = 0;
    let itemCount = 0;

    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          usedSpace += item.length * 2; // UTF-16 = 2 bytes per char
          itemCount++;
        }
      });

    return { usedSpace, itemCount };
  }
}

// Singleton instance
export const offlineCache = new OfflineCacheService();

// Helper function for fetching with cache fallback
export async function fetchWithCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options?: {
    forceRefresh?: boolean;
    onStaleData?: (data: T) => void;
  }
): Promise<T> {
  const { forceRefresh = false, onStaleData } = options || {};

  // If offline, return cached data immediately
  if (!offlineCache.getOnlineStatus()) {
    const cached = offlineCache.get<T>(cacheKey);
    if (cached) {
      console.log(`📴 [fetchWithCache] Usando caché offline: ${cacheKey}`);
      return cached;
    }
    throw new Error('Sin conexión y sin datos en caché');
  }

  // If online but not forcing refresh, check cache first
  if (!forceRefresh) {
    const { data: cached, isStale } = offlineCache.getWithMeta<T>(cacheKey);
    
    if (cached && !isStale) {
      console.log(`✅ [fetchWithCache] Usando caché fresco: ${cacheKey}`);
      return cached;
    }

    // If stale, return it immediately but fetch in background
    if (cached && isStale) {
      console.log(`🔄 [fetchWithCache] Datos obsoletos, refrescando: ${cacheKey}`);
      onStaleData?.(cached);
      
      // Fetch in background
      fetchFn()
        .then(freshData => {
          offlineCache.set(cacheKey, freshData);
        })
        .catch(console.error);
      
      return cached;
    }
  }

  // Fetch fresh data
  try {
    const data = await fetchFn();
    offlineCache.set(cacheKey, data);
    return data;
  } catch (error) {
    // If fetch fails, try to return cached data
    const cached = offlineCache.get<T>(cacheKey);
    if (cached) {
      console.log(`⚠️ [fetchWithCache] Error en fetch, usando caché: ${cacheKey}`);
      return cached;
    }
    throw error;
  }
}

export default offlineCache;
