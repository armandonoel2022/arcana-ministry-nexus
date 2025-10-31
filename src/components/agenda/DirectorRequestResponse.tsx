import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DirectorRequest {
  id: string;
  service_id: string;
  original_director_id: string;
  status: string;
  reason: string;
  requested_at: string;
  expires_at: string;
  original_director: {
    full_name: string;
    phone: string;
    email: string;
  } | null;
  services: {
    title: string;
    service_date: string;
    location: string;
    description: string;
  } | null;
}

const DirectorRequestResponse: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<DirectorRequest[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
    
    // Set up real-time subscription for new requests
    const channel = supabase
      .channel('director-requests')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'director_replacement_requests' },
        () => fetchPendingRequests()
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'director_replacement_requests' },
        () => fetchPendingRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('director_replacement_requests')
        .select(`
          id,
          service_id,
          original_director_id,
          status,
          reason,
          requested_at,
          expires_at,
          original_director:profiles!original_director_id (
            full_name,
            phone,
            email
          ),
          services (
            title,
            service_date,
            location,
            description
          )
        `)
        .eq('replacement_director_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle the relationship arrays
      const transformedData = (data || []).map(request => ({
        ...request,
        original_director: Array.isArray(request.original_director) 
          ? request.original_director[0] 
          : request.original_director,
        services: Array.isArray(request.services) 
          ? request.services[0] 
          : request.services
      }));
      
      setPendingRequests(transformedData);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Error al cargar solicitudes pendientes');
    }
  };

  const handleResponse = async (requestId: string, action: 'accepted' | 'rejected') => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Update the request status
      const { error: updateError } = await supabase
        .from('director_replacement_requests')
        .update({
          status: action,
          responded_at: new Date().toISOString(),
          notes: responseNotes.trim() || null
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get request details for notifications and service update
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Solicitud no encontrada');

      if (action === 'accepted') {
        // Get current user profile to obtain the full name
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        // Get the replacement director's next service to swap
        const { data: replacementDirectorNextService } = await supabase
          .from('services')
          .select('id, title, service_date, leader')
          .eq('leader', userProfile?.full_name)
          .gt('service_date', new Date().toISOString())
          .order('service_date', { ascending: true })
          .limit(1)
          .single();

        // Update current service to replacement director
        const { error: serviceError1 } = await supabase
          .from('services')
          .update({
            leader: userProfile?.full_name || 'Director de reemplazo',
            notes: `Director original: ${request.original_director?.full_name}. Reemplazado por: ${userProfile?.full_name || 'Director de reemplazo'}. ${responseNotes || ''}`
          })
          .eq('id', request.service_id);

        if (serviceError1) throw serviceError1;

        // If there's a next service for the replacement director, swap it to the original director
        if (replacementDirectorNextService) {
          const { error: serviceError2 } = await supabase
            .from('services')
            .update({
              leader: request.original_director?.full_name,
              notes: `Intercambio de turno - Director original: ${replacementDirectorNextService.leader}. Ahora dirigido por: ${request.original_director?.full_name}`
            })
            .eq('id', replacementDirectorNextService.id);

          if (serviceError2) throw serviceError2;
        }

        // Send notification to all members about the director change
        const { data: allMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true);

        if (allMembers) {
          const notifications = allMembers.map(member => ({
            recipient_id: member.id,
            sender_id: user.id,
            type: 'director_change',
            title: 'Cambio de Director Confirmado',
            message: `El servicio "${request.services?.title}" del ${request.services?.service_date && format(new Date(request.services.service_date), 'dd/MM/yyyy', { locale: es })} ahora será dirigido por ${userProfile?.full_name || 'Director de reemplazo'}. En espera de la selección de canciones.`,
            notification_category: 'agenda',
            metadata: {
              service_id: request.service_id,
               service_title: request.services?.title,
               service_date: request.services?.service_date,
               new_director: userProfile?.full_name || 'Director de reemplazo',
               original_director: request.original_director?.full_name
            }
          }));

          await supabase.from('system_notifications').insert(notifications);
        }
      }

      // Send notification to original director
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: request.original_director_id,
          sender_id: user.id,
          type: 'director_replacement_response',
          title: `Solicitud de Reemplazo ${action === 'accepted' ? 'Aceptada' : 'Rechazada'}`,
          message: `Tu solicitud de reemplazo para "${request.services?.title}" ha sido ${action === 'accepted' ? 'aceptada' : 'rechazada'}.`,
          metadata: {
            request_id: requestId,
            service_id: request.service_id,
             service_title: request.services?.title,
             service_date: request.services?.service_date,
            action: action,
            notes: responseNotes
          }
        });

      toast.success(`Solicitud ${action === 'accepted' ? 'aceptada' : 'rechazada'} exitosamente`);
      setRespondingTo(null);
      setResponseNotes('');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Error al responder la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay solicitudes pendientes
          </h3>
          <p className="text-gray-600">
            No tienes solicitudes de reemplazo de director pendientes de respuesta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">Solicitudes Pendientes ({pendingRequests.length})</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Responde a las solicitudes de otros directores para dirigir servicios
          </CardDescription>
        </CardHeader>
      </Card>

      {pendingRequests.map((request) => (
        <Card key={request.id} className={`${isExpired(request.expires_at) ? 'border-red-200 bg-red-50' : ''}`}>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                 <CardTitle className="text-base sm:text-lg truncate">{request.services?.title}</CardTitle>
                 <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                   <span className="flex items-center gap-1">
                     <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                     {request.services?.service_date && format(new Date(request.services.service_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                   </span>
                   <span className="truncate">📍 {request.services?.location}</span>
                 </CardDescription>
              </div>
              {isExpired(request.expires_at) && (
                <Badge variant="destructive" className="flex-shrink-0 text-xs">Expirado</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Original Director Info */}
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">Solicitud de: {request.original_director?.full_name}</span>
              </div>
               <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                 <div className="truncate">📞 {request.original_director?.phone}</div>
                 <div className="truncate">✉️ {request.original_director?.email}</div>
               </div>
            </div>

             {/* Service Details */}
             {request.services?.description && (
               <div className="space-y-2">
                 <h4 className="font-medium">Descripción del Servicio:</h4>
                 <p className="text-sm text-gray-600">{request.services.description}</p>
               </div>
             )}

            {/* Reason */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Razón del reemplazo:</h4>
              <p className="text-xs sm:text-sm text-gray-600 p-2 sm:p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                {request.reason}
              </p>
            </div>

            {/* Request Timeline */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm text-gray-500">
              <span className="truncate">Solicitado: {format(new Date(request.requested_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              <span className={`truncate ${isExpired(request.expires_at) ? 'text-red-600 font-medium' : ''}`}>
                Expira: {format(new Date(request.expires_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            </div>

            {/* Response Section */}
            {!isExpired(request.expires_at) && (
              <div className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
                {respondingTo === request.id ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">
                        Notas de respuesta (opcional)
                      </label>
                      <Textarea
                        value={responseNotes}
                        onChange={(e) => setResponseNotes(e.target.value)}
                        placeholder="Agrega cualquier comentario adicional..."
                        rows={3}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => handleResponse(request.id, 'accepted')}
                        disabled={isLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        size="sm"
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {isLoading ? 'Procesando...' : 'Aceptar'}
                      </Button>
                      <Button 
                        onClick={() => handleResponse(request.id, 'rejected')}
                        disabled={isLoading}
                        variant="destructive"
                        className="flex-1 text-xs sm:text-sm"
                        size="sm"
                      >
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {isLoading ? 'Procesando...' : 'Rechazar'}
                      </Button>
                      <Button 
                        onClick={() => setRespondingTo(null)}
                        variant="outline"
                        className="text-xs sm:text-sm"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setRespondingTo(request.id)}
                      className="flex-1 text-xs sm:text-sm"
                      size="sm"
                    >
                      Responder Solicitud
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isExpired(request.expires_at) && (
              <div className="text-center py-4 text-red-600">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Esta solicitud ha expirado</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DirectorRequestResponse;
