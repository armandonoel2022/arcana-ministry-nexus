import { supabase } from '@/integrations/supabase/client';

// Caché local de miembros inactivos
let inactiveMembersCache: Set<string> = new Set();
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene los IDs de miembros que están actualmente en licencia
 * @returns Set<string> con los IDs de miembros inactivos
 */
export const getInactiveMemberIds = async (): Promise<Set<string>> => {
  const now = Date.now();
  
  // Si el caché es reciente, usarlo
  if (now - lastFetchTime < CACHE_DURATION && inactiveMembersCache.size > 0) {
    return inactiveMembersCache;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('member_leaves')
      .select('member_id')
      .eq('status', 'aprobada')
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (error) {
      console.error('Error fetching inactive members:', error);
      return inactiveMembersCache; // Retornar caché antiguo en caso de error
    }

    const inactiveIds = new Set(data?.map((d) => d.member_id) || []);
    inactiveMembersCache = inactiveIds;
    lastFetchTime = now;

    return inactiveIds;
  } catch (error) {
    console.error('Error in getInactiveMemberIds:', error);
    return inactiveMembersCache;
  }
};

/**
 * Obtiene los IDs de miembros dados de baja definitiva
 */
export const getDischargedMemberIds = async (): Promise<Set<string>> => {
  try {
    const { data, error } = await supabase
      .from('member_leaves')
      .select('member_id')
      .eq('status', 'aprobada')
      .eq('leave_type', 'baja_definitiva');

    if (error) {
      console.error('Error fetching discharged members:', error);
      return new Set();
    }

    return new Set(data?.map((d) => d.member_id) || []);
  } catch (error) {
    console.error('Error in getDischargedMemberIds:', error);
    return new Set();
  }
};

/**
 * Verifica si un miembro específico está activo (no tiene licencia vigente)
 */
export const isMemberActiveById = async (memberId: string): Promise<boolean> => {
  const inactiveIds = await getInactiveMemberIds();
  return !inactiveIds.has(memberId);
};

/**
 * Filtra una lista de miembros, excluyendo los que están en licencia
 */
export const filterActiveMemberIds = async (memberIds: string[]): Promise<string[]> => {
  const inactiveIds = await getInactiveMemberIds();
  return memberIds.filter((id) => !inactiveIds.has(id));
};

/**
 * Limpia el caché de miembros inactivos
 */
export const clearInactiveMembersCache = (): void => {
  inactiveMembersCache = new Set();
  lastFetchTime = 0;
};
