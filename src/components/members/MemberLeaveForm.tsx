import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, UserCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LeaveType, 
  LEAVE_TYPE_LABELS, 
  CreateLeaveData,
  useMemberLeaves 
} from '@/hooks/useMemberLeaves';
import { usePermissions } from '@/hooks/usePermissions';

interface Profile {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface MemberLeaveFormProps {
  profileId?: string; // Si se pasa, es para un miembro específico
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MemberLeaveForm: React.FC<MemberLeaveFormProps> = ({
  profileId,
  onSuccess,
  onCancel,
}) => {
  const { createLeave } = useMemberLeaves();
  const { isAdmin } = usePermissions();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedProfileId, setSelectedProfileId] = useState(profileId || '');
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [reason, setReason] = useState('');
  const [reasonVisible, setReasonVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [notes, setNotes] = useState('');
  const [autoApprove, setAutoApprove] = useState(isAdmin);

  // Tipos que solo los admins pueden usar
  const adminOnlyTypes: LeaveType[] = ['disciplina', 'suspension', 'baja_definitiva'];
  
  // Tipos disponibles según el rol
  const availableTypes: LeaveType[] = isAdmin
    ? Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]
    : (Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).filter(
        (t) => !adminOnlyTypes.includes(t)
      );

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url')
          .eq('is_active', true)
          .order('full_name');

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    if (!profileId) {
      fetchProfiles();
    } else {
      setLoadingProfiles(false);
    }
  }, [profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfileId || !leaveType) return;

    // Validar que 'otra' requiere razón
    if (leaveType === 'otra' && !reason.trim()) {
      return;
    }

    setSubmitting(true);

    const leaveData: CreateLeaveData = {
      profile_id: selectedProfileId,
      leave_type: leaveType as LeaveType,
      reason: reason.trim() || undefined,
      reason_visible: reasonVisible,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: isIndefinite ? null : endDate ? format(endDate, 'yyyy-MM-dd') : null,
      is_indefinite: isIndefinite,
      notes: notes.trim() || undefined,
      status: autoApprove && isAdmin ? 'aprobada' : 'pendiente',
    };

    const success = await createLeave(leaveData);
    setSubmitting(false);

    if (success) {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de miembro */}
      {!profileId && (
        <div className="space-y-2">
          <Label htmlFor="profile">Integrante</Label>
          {loadingProfiles ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando...
            </div>
          ) : (
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar integrante" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      {profile.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Tipo de licencia */}
      <div className="space-y-2">
        <Label htmlFor="leaveType">Tipo de Licencia</Label>
        <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {LEAVE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Razón */}
      <div className="space-y-2">
        <Label htmlFor="reason">
          Razón {leaveType === 'otra' && <span className="text-red-500">*</span>}
        </Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe la razón de la licencia..."
          rows={3}
          required={leaveType === 'otra'}
        />
      </div>

      {/* Visibilidad de la razón */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="reasonVisible">Mostrar razón públicamente</Label>
          <p className="text-sm text-muted-foreground">
            Si está activo, todos los miembros podrán ver la razón de la licencia
          </p>
        </div>
        <Switch
          id="reasonVisible"
          checked={reasonVisible}
          onCheckedChange={setReasonVisible}
        />
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha de Inicio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {!isIndefinite && (
          <div className="space-y-2">
            <Label>Fecha de Fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  locale={es}
                  disabled={(date) => date < startDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Licencia indefinida */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="isIndefinite">Licencia Indefinida</Label>
          <p className="text-sm text-muted-foreground">
            Sin fecha de finalización establecida
          </p>
        </div>
        <Switch
          id="isIndefinite"
          checked={isIndefinite}
          onCheckedChange={setIsIndefinite}
        />
      </div>

      {/* Notas internas (solo admins) */}
      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="notes">Notas Internas (solo admins)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas privadas sobre esta licencia..."
            rows={2}
          />
        </div>
      )}

      {/* Auto-aprobar (solo admins) */}
      {isAdmin && (
        <div className="flex items-center justify-between rounded-lg border p-4 bg-green-50">
          <div className="space-y-0.5">
            <Label htmlFor="autoApprove" className="text-green-800">
              Aprobar inmediatamente
            </Label>
            <p className="text-sm text-green-600">
              La licencia entrará en vigor sin necesidad de aprobación
            </p>
          </div>
          <Switch
            id="autoApprove"
            checked={autoApprove}
            onCheckedChange={setAutoApprove}
          />
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || !selectedProfileId || !leaveType}
          className="flex-1"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Crear Licencia'
          )}
        </Button>
      </div>
    </form>
  );
};

export default MemberLeaveForm;
