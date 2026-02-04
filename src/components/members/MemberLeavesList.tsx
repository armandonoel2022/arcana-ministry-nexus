import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Calendar,
  Clock,
  UserMinus,
  Loader2,
  Share2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MemberLeave,
  LeaveStatus,
  LeaveType,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_COLORS,
  useMemberLeaves,
} from '@/hooks/useMemberLeaves';
import { usePermissions } from '@/hooks/usePermissions';
import LeaveNotificationOverlay from '@/components/notifications/LeaveNotificationOverlay';

interface MemberLeavesListProps {
  showOnlyActive?: boolean;
  profileId?: string; // Filtrar por miembro específico
}

const MemberLeavesList: React.FC<MemberLeavesListProps> = ({
  showOnlyActive = false,
  profileId,
}) => {
  const { leaves, loading, approveLeave, rejectLeave, endLeave, deleteLeave } = useMemberLeaves();
  const { isAdmin } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LeaveType | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayLeave, setOverlayLeave] = useState<MemberLeave | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Filtrar licencias
  let filteredLeaves = leaves;

  if (profileId) {
    filteredLeaves = filteredLeaves.filter((l) => l.profile_id === profileId);
  }

  if (showOnlyActive) {
    filteredLeaves = filteredLeaves.filter(
      (l) =>
        l.status === 'aprobada' &&
        l.start_date <= today &&
        (l.end_date === null || l.end_date >= today)
    );
  }

  if (statusFilter !== 'all') {
    filteredLeaves = filteredLeaves.filter((l) => l.status === statusFilter);
  }

  if (typeFilter !== 'all') {
    filteredLeaves = filteredLeaves.filter((l) => l.leave_type === typeFilter);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredLeaves = filteredLeaves.filter((l) =>
      l.profile?.full_name?.toLowerCase().includes(term)
    );
  }

  const handleApprove = async (leaveId: string) => {
    setProcessingId(leaveId);
    await approveLeave(leaveId);
    setProcessingId(null);
  };

  const handleReject = async (leaveId: string) => {
    setProcessingId(leaveId);
    await rejectLeave(leaveId);
    setProcessingId(null);
  };

  const handleEnd = async (leaveId: string) => {
    setProcessingId(leaveId);
    await endLeave(leaveId);
    setProcessingId(null);
  };

  const handleDelete = async (leaveId: string) => {
    setProcessingId(leaveId);
    await deleteLeave(leaveId);
    setProcessingId(null);
  };

  const handleShare = (leave: MemberLeave) => {
    setOverlayLeave(leave);
    setShowOverlay(true);
  };

  const getStatusBadgeVariant = (status: LeaveStatus) => {
    switch (status) {
      case 'aprobada':
        return 'default';
      case 'pendiente':
        return 'secondary';
      case 'rechazada':
        return 'destructive';
      case 'finalizada':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeaveStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as LeaveType | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de licencias */}
      {filteredLeaves.length === 0 ? (
        <div className="text-center py-12">
          <UserMinus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No se encontraron licencias</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar y nombre */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar
                      className={`w-12 h-12 ${
                        leave.leave_type === 'baja_definitiva' ? 'grayscale' : ''
                      }`}
                    >
                      <AvatarImage
                        src={leave.profile?.photo_url || undefined}
                        alt={leave.profile?.full_name}
                      />
                      <AvatarFallback>
                        {leave.profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{leave.profile?.full_name}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={LEAVE_TYPE_COLORS[leave.leave_type]}>
                          {LEAVE_TYPE_LABELS[leave.leave_type]}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(leave.status)}>
                          {LEAVE_STATUS_LABELS[leave.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(leave.start_date), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                    {leave.is_indefinite ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Indefinida
                      </Badge>
                    ) : leave.end_date ? (
                      <div className="flex items-center gap-1">
                        <span>→</span>
                        <span>{format(new Date(leave.end_date), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Acciones */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {/* Botón compartir */}
                      {leave.status === 'aprobada' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(leave)}
                          className="text-blue-600"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Acciones según estado */}
                      {leave.status === 'pendiente' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(leave.id)}
                            disabled={processingId === leave.id}
                            className="text-green-600"
                          >
                            {processingId === leave.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(leave.id)}
                            disabled={processingId === leave.id}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {leave.status === 'aprobada' && leave.leave_type !== 'baja_definitiva' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEnd(leave.id)}
                          disabled={processingId === leave.id}
                          className="text-amber-600"
                        >
                          Finalizar
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar licencia?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(leave.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                {/* Razón (si es visible o es admin) */}
                {leave.reason && (leave.reason_visible || isAdmin) && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-1">
                      {leave.reason_visible ? (
                        <Eye className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {leave.reason_visible ? 'Razón pública' : 'Razón privada'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                  </div>
                )}

                {/* Notas internas (solo admin) */}
                {isAdmin && leave.notes && (
                  <div className="mt-3 pt-3 border-t bg-yellow-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                    <p className="text-xs text-yellow-600 font-medium mb-1">Notas internas:</p>
                    <p className="text-sm text-yellow-800">{leave.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overlay para compartir */}
      {showOverlay && overlayLeave && (
        <LeaveNotificationOverlay
          leave={overlayLeave}
          onClose={() => {
            setShowOverlay(false);
            setOverlayLeave(null);
          }}
        />
      )}
    </div>
  );
};

export default MemberLeavesList;
