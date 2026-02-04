import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type LeaveType = 
  | 'enfermedad'
  | 'maternidad'
  | 'estudios'
  | 'trabajo'
  | 'vacaciones'
  | 'disciplina'
  | 'suspension'
  | 'baja_definitiva'
  | 'otra';

export type LeaveStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | 'finalizada';

export interface MemberLeave {
  id: string;
  member_id: string;
  leave_type: LeaveType;
  status: LeaveStatus;
  reason: string | null;
  reason_visible: boolean;
  start_date: string;
  end_date: string | null;
  is_indefinite: boolean;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data from members table
  member?: {
    id: string;
    nombres: string;
    apellidos: string;
    photo_url: string | null;
    email: string | null;
  };
  requester?: {
    full_name: string;
  };
  approver?: {
    full_name: string;
  };
}

export interface CreateLeaveData {
  member_id: string;
  leave_type: LeaveType;
  reason?: string;
  reason_visible?: boolean;
  start_date?: string;
  end_date?: string | null;
  is_indefinite?: boolean;
  notes?: string;
  status?: LeaveStatus;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  enfermedad: 'Enfermedad',
  maternidad: 'Maternidad/Paternidad',
  estudios: 'Estudios',
  trabajo: 'Trabajo',
  vacaciones: 'Vacaciones',
  disciplina: 'Disciplina',
  suspension: 'Suspensión',
  baja_definitiva: 'Baja Definitiva',
  otra: 'Otra Razón',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
};

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  enfermedad: 'bg-red-100 text-red-700 border-red-200',
  maternidad: 'bg-pink-100 text-pink-700 border-pink-200',
  estudios: 'bg-blue-100 text-blue-700 border-blue-200',
  trabajo: 'bg-amber-100 text-amber-700 border-amber-200',
  vacaciones: 'bg-green-100 text-green-700 border-green-200',
  disciplina: 'bg-orange-100 text-orange-700 border-orange-200',
  suspension: 'bg-purple-100 text-purple-700 border-purple-200',
  baja_definitiva: 'bg-gray-100 text-gray-700 border-gray-200',
  otra: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function useMemberLeaves() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<MemberLeave[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('member_leaves')
        .select(`
          *,
          member:members!member_leaves_member_id_fkey(id, nombres, apellidos, photo_url, email),
          requester:profiles!member_leaves_requested_by_fkey(full_name),
          approver:profiles!member_leaves_approved_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaves((data as unknown as MemberLeave[]) || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las licencias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getActiveLeaveForMember = useCallback((memberId: string): MemberLeave | null => {
    const today = new Date().toISOString().split('T')[0];
    return leaves.find(
      (leave) =>
        leave.member_id === memberId &&
        leave.status === 'aprobada' &&
        leave.start_date <= today &&
        (leave.end_date === null || leave.end_date >= today)
    ) || null;
  }, [leaves]);

  const isMemberOnLeave = useCallback((memberId: string): boolean => {
    return getActiveLeaveForMember(memberId) !== null;
  }, [getActiveLeaveForMember]);

  const isMemberDischarged = useCallback((memberId: string): boolean => {
    return leaves.some(
      (leave) =>
        leave.member_id === memberId &&
        leave.status === 'aprobada' &&
        leave.leave_type === 'baja_definitiva'
    );
  }, [leaves]);

  const createLeave = useCallback(async (data: CreateLeaveData): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase.from('member_leaves').insert({
        ...data,
        requested_by: user.id,
        status: data.status || 'pendiente',
      });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Licencia creada correctamente',
      });
      
      fetchLeaves();
      return true;
    } catch (error) {
      console.error('Error creating leave:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la licencia',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast, fetchLeaves]);

  const approveLeave = useCallback(async (leaveId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('member_leaves')
        .update({
          status: 'aprobada',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Licencia aprobada correctamente',
      });
      
      fetchLeaves();
      return true;
    } catch (error) {
      console.error('Error approving leave:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar la licencia',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast, fetchLeaves]);

  const rejectLeave = useCallback(async (leaveId: string, rejectionReason?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('member_leaves')
        .update({
          status: 'rechazada',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Licencia rechazada',
      });
      
      fetchLeaves();
      return true;
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la licencia',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast, fetchLeaves]);

  const endLeave = useCallback(async (leaveId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('member_leaves')
        .update({
          status: 'finalizada',
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Licencia finalizada correctamente',
      });
      
      fetchLeaves();
      return true;
    } catch (error) {
      console.error('Error ending leave:', error);
      toast({
        title: 'Error',
        description: 'No se pudo finalizar la licencia',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchLeaves]);

  const deleteLeave = useCallback(async (leaveId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('member_leaves')
        .delete()
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Licencia eliminada correctamente',
      });
      
      fetchLeaves();
      return true;
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la licencia',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchLeaves]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return {
    leaves,
    loading,
    fetchLeaves,
    createLeave,
    approveLeave,
    rejectLeave,
    endLeave,
    deleteLeave,
    isMemberOnLeave,
    isMemberDischarged,
    getActiveLeaveForMember,
  };
}
