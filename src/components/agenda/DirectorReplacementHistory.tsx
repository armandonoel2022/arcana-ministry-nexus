import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, AlertTriangle, Calendar, User, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HistoricalRequest {
  id: string;
  status: string;
  reason: string;
  requested_at: string;
  responded_at: string | null;
  expires_at: string;
  notes: string | null;
  original_director_id: string;
  original_director: {
    full_name: string;
    phone: string;
    email: string;
  };
  replacement_director: {
    full_name: string;
    phone: string;
    email: string;
  };
  services: {
    title: string;
    service_date: string;
    location: string;
  };
}

const DirectorReplacementHistory = () => {
  const [requests, setRequests] = useState<HistoricalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchAllRequests();
      subscribeToChanges();
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchAllRequests = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('director_replacement_requests')
        .select(`
          *,
          original_director:profiles!original_director_id (
            full_name,
            phone,
            email
          ),
          replacement_director:profiles!replacement_director_id (
            full_name,
            phone,
            email
          ),
          services (
            title,
            service_date,
            location
          )
        `)
        .or(`original_director_id.eq.${currentUserId},replacement_director_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('director-replacement-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'director_replacement_requests'
        },
        () => {
          fetchAllRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('director_replacement_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitud cancelada exitosamente');
      fetchAllRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error('Error al cancelar la solicitud');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceptado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expirado/Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cargando historial...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No hay solicitudes de reemplazo en el historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isOriginator = request.original_director_id === currentUserId;
        const isPending = request.status === 'pending';
        const expired = isExpired(request.expires_at);

        return (
          <Card key={request.id} className={isPending && !expired ? 'border-yellow-200 bg-yellow-50/30' : ''}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(expired && isPending ? 'expired' : request.status)}
                    {expired && isPending && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expirado
                      </Badge>
                    )}
                  </div>
                  {isOriginator && isPending && !expired && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelRequest(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar Solicitud
                    </Button>
                  )}
                </div>

                {/* Service Info */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    {request.services.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(request.services.service_date), "EEEE, dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    📍 {request.services.location}
                  </div>
                </div>

                {/* Directors Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Director Original:
                    </div>
                    <div className="text-sm">{request.original_director.full_name}</div>
                    {isOriginator && (
                      <div className="text-xs text-muted-foreground">(Tú)</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Director Solicitado:
                    </div>
                    <div className="text-sm">{request.replacement_director.full_name}</div>
                    {!isOriginator && (
                      <div className="text-xs text-muted-foreground">(Tú)</div>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <div className="text-sm font-medium">Razón:</div>
                  <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                    {request.reason}
                  </div>
                </div>

                {/* Notes (if any) */}
                {request.notes && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Notas de respuesta:</div>
                    <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                      {request.notes}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                  <div>
                    Solicitado: {format(new Date(request.requested_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </div>
                  {request.responded_at && (
                    <div>
                      Respondido: {format(new Date(request.responded_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                  )}
                  {isPending && !expired && (
                    <div className="text-yellow-600">
                      Expira: {format(new Date(request.expires_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DirectorReplacementHistory;
