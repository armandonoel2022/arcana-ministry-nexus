import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { syncAllData, needsSync } from '@/services/backgroundSync';
import { useOnlineStatus } from '@/hooks/useOfflineCache';

/**
 * Background sync component - placed inside ProtectedRoute
 * Automatically syncs all data when user is authenticated and online
 */
export function BackgroundSyncProvider() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const hasSynced = useRef(false);
  const syncIntervalRef = useRef<number | null>(null);

  // Initial sync when user logs in or app loads
  useEffect(() => {
    if (!user || !isOnline) return;

    if (!hasSynced.current && needsSync()) {
      hasSynced.current = true;
      // Delay initial sync slightly to let the UI render first
      const timeout = setTimeout(() => {
        syncAllData();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [user, isOnline]);

  // Re-sync when coming back online
  useEffect(() => {
    if (isOnline && user && hasSynced.current) {
      console.log('🌐 [BackgroundSync] Conexión restaurada, re-sincronizando...');
      syncAllData();
    }
  }, [isOnline, user]);

  // Periodic sync every 30 minutes
  useEffect(() => {
    if (!user) return;

    syncIntervalRef.current = window.setInterval(() => {
      if (navigator.onLine && needsSync()) {
        syncAllData();
      }
    }, 30 * 60 * 1000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [user]);

  return null;
}
