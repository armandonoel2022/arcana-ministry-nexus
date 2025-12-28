import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'admin' | 'lider' | 'vocal' | 'musico' | 'miembro';

interface ScreenPermission {
  screen_path: string;
  screen_name: string;
  screen_category: string;
  can_view: boolean;
  can_edit: boolean;
}

interface UsePermissionsReturn {
  roles: AppRole[];
  permissions: ScreenPermission[];
  isLoading: boolean;
  isAdmin: boolean;
  isLider: boolean;
  hasRole: (role: AppRole) => boolean;
  canView: (path: string) => boolean;
  canEdit: (path: string) => boolean;
  getVisibleMenuItems: () => ScreenPermission[];
  refetch: () => Promise<void>;
}

// Cache for permissions to enable offline access
const PERMISSIONS_CACHE_KEY = 'arcana_permissions_cache';
const ROLES_CACHE_KEY = 'arcana_roles_cache';

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<ScreenPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from cache first
  const loadFromCache = useCallback(() => {
    try {
      const cachedRoles = localStorage.getItem(ROLES_CACHE_KEY);
      const cachedPermissions = localStorage.getItem(PERMISSIONS_CACHE_KEY);
      
      if (cachedRoles) {
        setRoles(JSON.parse(cachedRoles));
      }
      if (cachedPermissions) {
        setPermissions(JSON.parse(cachedPermissions));
      }
    } catch (error) {
      console.error('Error loading permissions from cache:', error);
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((newRoles: AppRole[], newPermissions: ScreenPermission[]) => {
    try {
      localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(newRoles));
      localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(newPermissions));
    } catch (error) {
      console.error('Error saving permissions to cache:', error);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setRoles([]);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        // Fall back to cache
        loadFromCache();
        setIsLoading(false);
        return;
      }

      const userRoles = (rolesData?.map(r => r.role) || []) as AppRole[];
      
      // If no roles, default to 'miembro'
      const effectiveRoles = userRoles.length > 0 ? userRoles : ['miembro' as AppRole];

      // Fetch permissions for user's roles
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('screen_permissions')
        .select('screen_path, screen_name, screen_category, can_view, can_edit')
        .in('role', effectiveRoles);

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        loadFromCache();
        setIsLoading(false);
        return;
      }

      // Merge permissions - if any role allows view/edit, allow it
      const mergedPermissions: Record<string, ScreenPermission> = {};
      
      permissionsData?.forEach((perm) => {
        const existing = mergedPermissions[perm.screen_path];
        if (existing) {
          existing.can_view = existing.can_view || perm.can_view;
          existing.can_edit = existing.can_edit || perm.can_edit;
        } else {
          mergedPermissions[perm.screen_path] = { ...perm };
        }
      });

      const finalPermissions = Object.values(mergedPermissions);
      
      setRoles(effectiveRoles);
      setPermissions(finalPermissions);
      saveToCache(effectiveRoles, finalPermissions);
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
      loadFromCache();
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadFromCache, saveToCache]);

  // Initial load from cache, then fetch fresh data
  useEffect(() => {
    loadFromCache();
    fetchPermissions();
  }, [fetchPermissions, loadFromCache]);

  const isAdmin = roles.includes('admin');
  const isLider = roles.includes('lider');

  const hasRole = useCallback((role: AppRole) => {
    return roles.includes(role);
  }, [roles]);

  const canView = useCallback((path: string) => {
    // Admins can view everything
    if (isAdmin) return true;
    
    const permission = permissions.find(p => p.screen_path === path);
    return permission?.can_view ?? false;
  }, [permissions, isAdmin]);

  const canEdit = useCallback((path: string) => {
    // Admins can edit everything
    if (isAdmin) return true;
    
    const permission = permissions.find(p => p.screen_path === path);
    return permission?.can_edit ?? false;
  }, [permissions, isAdmin]);

  const getVisibleMenuItems = useCallback(() => {
    if (isAdmin) return permissions;
    return permissions.filter(p => p.can_view);
  }, [permissions, isAdmin]);

  return {
    roles,
    permissions,
    isLoading,
    isAdmin,
    isLider,
    hasRole,
    canView,
    canEdit,
    getVisibleMenuItems,
    refetch: fetchPermissions,
  };
}
