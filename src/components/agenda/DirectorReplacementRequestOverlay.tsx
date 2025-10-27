import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Calendar, User, Clock, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestData {
  id: string;
  service_id: string;
  original_director_id: string;
  reason: string;
  requested_at: string;
  expires_at: string;
  original_director: {
    full_name: string;
    phone: string;
    email: string;
    photo_url?: string;
  };
  services: {
    title: string;
    service_date: string;
    location: string;
  };
}

const DirectorReplacementRequestOverlay = () => {
  const [currentRequest, setCurrentRequest] = useState<RequestData | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkForPendingRequests();

    // Listen for new requests
    const channel = supabase
      .channel('director-request-overlay')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'director_replacement_requests' 
        },
        () => checkForPendingRequests()
      )
      .subscribe();

    // Listen for test overlay events
    const handleTestOverlay = (event: Event) => {
      const customEvent = event as CustomEvent<RequestData>;
      if (customEvent.detail) {
        setCurrentRequest(customEvent.detail);
      }
    };

    window.addEventListener('testDirectorRequestOverlay', handleTestOverlay);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('testDirectorRequestOverlay', handleTestOverlay);
    };
  }, []);

  const checkForPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('director_replacement_requests')
        .select(`
          id,
          service_id,
          original_director_id,
          reason,
          requested_at,
          expires_at,
          original_director:profiles!original_director_id (
            full_name,
            phone,
            email,
            photo_url
          ),
          services (
            title,
            service_date,
            location
          )
        `)
        .eq('replacement_director_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not a "no rows" error
          throw error;
        }
        return;
      }

      if (data) {
        const transformedData = {
          ...data,
          original_director: Array.isArray(data.original_director) 
            ? data.original_director[0] 
            : data.original_director,
          services: Array.isArray(data.services) 
            ? data.services[0] 
            : data.services
        };
        setCurrentRequest(transformedData);

        // Fallback: if original director has no profile photo, try members.photo_url by email
        try {
          if (!transformedData.original_director?.photo_url && transformedData.original_director?.email) {
            const { data: member } = await supabase
              .from('members')
              .select('photo_url')
              .eq('email', transformedData.original_director.email)
              .maybeSingle();
            if (member?.photo_url) {
              setCurrentRequest(prev => prev ? {
                ...prev,
                original_director: {
                  ...prev.original_director,
                  photo_url: member.photo_url
                }
              } : prev);
            }
          }
        } catch (e) {
          console.warn('Fallback members photo lookup failed:', e);
        }
      }
    } catch (error) {
      console.error('Error checking for pending requests:', error);
    }
  };

  const handleResponse = async (action: 'accepted' | 'rejected') => {
    if (!currentRequest) return;
    
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
        .eq('id', currentRequest.id);

      if (updateError) throw updateError;

      if (action === 'accepted') {
        // Get current user profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name, photo_url, email')
          .eq('id', user.id)
          .single();

        // Update service leader for the requested service
        await supabase
          .from('services')
          .update({
            leader: userProfile?.full_name || 'Director de reemplazo',
            notes: `Director original: ${currentRequest.original_director?.full_name}. Reemplazado por: ${userProfile?.full_name || 'Director de reemplazo'}. ${responseNotes || ''}`
          })
          .eq('id', currentRequest.service_id);

        // BALANCE: Find other services led by the new director (current user) and reassign to original director
        const { data: newDirectorServices } = await supabase
          .from('services')
          .select('id, title, service_date')
          .eq('leader', userProfile?.full_name)
          .neq('id', currentRequest.service_id) // Exclude the service we just accepted
          .gte('service_date', new Date().toISOString()); // Only future services

        if (newDirectorServices && newDirectorServices.length > 0) {
          // Reassign the first service found to the original director
          const serviceToReassign = newDirectorServices[0];
          await supabase
            .from('services')
            .update({
              leader: currentRequest.original_director?.full_name,
              notes: `Reasignado automáticamente desde ${userProfile?.full_name} para mantener equilibrio de servicios.`
            })
            .eq('id', serviceToReassign.id);

          // Notify original director about the reassignment
          await supabase
            .from('system_notifications')
            .insert({
              recipient_id: currentRequest.original_director_id,
              sender_id: user.id,
              type: 'director_change',
              title: 'Servicio Reasignado Automáticamente',
              message: `Para mantener el equilibrio, se te ha asignado el servicio "${serviceToReassign.title}" del ${format(new Date(serviceToReassign.service_date), 'dd/MM/yyyy', { locale: es })} que originalmente era de ${userProfile?.full_name}.`,
              notification_category: 'agenda',
              metadata: {
                service_id: serviceToReassign.id,
                service_title: serviceToReassign.title,
                service_date: serviceToReassign.service_date,
                new_director: currentRequest.original_director?.full_name,
                new_director_photo: currentRequest.original_director?.photo_url,
                original_director: userProfile?.full_name,
                original_director_photo: userProfile?.photo_url
              }
            });
        }

        // Send notification to all members about the accepted replacement
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
            message: `El servicio "${currentRequest.services?.title}" del ${currentRequest.services?.service_date && format(new Date(currentRequest.services.service_date), 'dd/MM/yyyy', { locale: es })} ahora será dirigido por ${userProfile?.full_name || 'Director de reemplazo'}`,
            notification_category: 'agenda',
            metadata: {
              service_id: currentRequest.service_id,
              service_title: currentRequest.services?.title,
              service_date: currentRequest.services?.service_date,
              new_director: userProfile?.full_name || 'Director de reemplazo',
              new_director_photo: userProfile?.photo_url,
              original_director: currentRequest.original_director?.full_name,
              original_director_photo: currentRequest.original_director?.photo_url
            }
          }));

          await supabase.from('system_notifications').insert(notifications);
        }
      }

      // Send notification to original director
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: currentRequest.original_director_id,
          sender_id: user.id,
          type: 'director_replacement_response',
          title: `Solicitud ${action === 'accepted' ? 'Aceptada' : 'Rechazada'}`,
          message: `Tu solicitud de reemplazo para "${currentRequest.services?.title}" ha sido ${action === 'accepted' ? 'aceptada' : 'rechazada'}.`,
          metadata: {
            request_id: currentRequest.id,
            service_id: currentRequest.service_id,
            service_title: currentRequest.services?.title,
            service_date: currentRequest.services?.service_date,
            action: action,
            notes: responseNotes
          }
        });

      toast.success(`Solicitud ${action === 'accepted' ? 'aceptada' : 'rechazada'}`);
      setCurrentRequest(null);
      setResponseNotes('');
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Error al responder la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setCurrentRequest(null);
    setResponseNotes('');
  };

  if (!currentRequest) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl text-center">
            Solicitud de Reemplazo de Director
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Service Info */}
          <div className="text-center p-4 bg-blue-50 rounded-lg space-y-2">
            <h3 className="text-xl font-bold text-blue-900">{currentRequest.services?.title}</h3>
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {currentRequest.services?.service_date && format(new Date(currentRequest.services.service_date), "EEEE, dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
            <div className="text-blue-600">
              📍 {currentRequest.services?.location}
            </div>
          </div>

          {/* Original Director */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {currentRequest.original_director?.photo_url ? (
                <img 
                  src={currentRequest.original_director.photo_url} 
                  alt={currentRequest.original_director.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Solicita: {currentRequest.original_director?.full_name}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1 mt-1">
                <div>📞 {currentRequest.original_director?.phone}</div>
                <div>✉️ {currentRequest.original_director?.email}</div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Razón del reemplazo:
            </h4>
            <p className="text-gray-700 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              {currentRequest.reason}
            </p>
          </div>

          {/* Timeline */}
          <div className="flex justify-between text-sm text-gray-500 border-t pt-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Solicitado: {format(new Date(currentRequest.requested_at), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
            <span className="text-orange-600 font-medium">
              Expira: {format(new Date(currentRequest.expires_at), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
          </div>

          {/* Response Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Notas de respuesta (opcional)
            </label>
            <Textarea
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              placeholder="Agrega cualquier comentario adicional..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => handleResponse('accepted')}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Procesando...' : 'Aceptar Solicitud'}
            </Button>
            <Button 
              onClick={() => handleResponse('rejected')}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <XCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Procesando...' : 'Rechazar'}
            </Button>
            <Button 
              onClick={handleDismiss}
              variant="outline"
              disabled={isLoading}
            >
              Después
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorReplacementRequestOverlay;