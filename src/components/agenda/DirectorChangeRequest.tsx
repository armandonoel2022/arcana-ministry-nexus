import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DirectorChangeRequestProps {
  serviceId: string;
  currentDirector: string;
  serviceDate: string;
  serviceTitle: string;
  onRequestCreated?: () => void;
}

interface AvailableDirector {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

interface DirectorRequest {
  id: string;
  status: string;
  reason: string;
  requested_at: string;
  responded_at: string | null;
  expires_at: string;
  notes: string | null;
  replacement_director: {
    full_name: string;
    phone: string;
    email: string;
  };
}

const DirectorChangeRequest: React.FC<DirectorChangeRequestProps> = ({
  serviceId,
  currentDirector,
  serviceDate,
  serviceTitle,
  onRequestCreated
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [availableDirectors, setAvailableDirectors] = useState<AvailableDirector[]>([]);
  const [selectedDirector, setSelectedDirector] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingRequests, setExistingRequests] = useState<DirectorRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentUser();
    fetchExistingRequests();
  }, [serviceId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchAvailableDirectors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener TODOS los directores de alabanza de la tabla members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, nombres, apellidos, celular, email')
        .in('cargo', ['director_alabanza', 'directora_alabanza', 'pastor']);

      if (membersError) throw membersError;

      // Obtener el perfil del usuario actual para excluirlo
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .maybeSingle();

      const currentUserEmail = currentProfile?.email?.toLowerCase();
      const currentUserName = currentProfile?.full_name?.toLowerCase();

      // Filtrar para excluir al usuario actual (por email o nombre) y mapear a formato esperado
      const directors = (membersData || [])
        .filter(m => {
          const memberEmail = m.email?.toLowerCase();
          const memberFullName = `${m.nombres} ${m.apellidos}`.toLowerCase();
          
          // Excluir si el email coincide O si el nombre completo coincide
          const isSameEmail = memberEmail && currentUserEmail && memberEmail === currentUserEmail;
          const isSameName = memberFullName === currentUserName;
          
          return !isSameEmail && !isSameName;
        })
        .map(m => ({
          id: m.id,
          full_name: `${m.nombres} ${m.apellidos}`,
          phone: m.celular || 'Sin teléfono',
          email: m.email || 'Sin email'
        }));
      
      setAvailableDirectors(directors);
      
      // Si el valor seleccionado anterior no pertenece a la lista actual, reiniciarlo
      if (!directors.some((d: any) => d.id === selectedDirector)) {
        setSelectedDirector('');
      }
    } catch (error) {
      console.error('Error fetching available directors:', error);
      toast.error('Error al cargar directores disponibles');
    }
  };

  const fetchExistingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('director_replacement_requests')
        .select(`
          *,
          replacement_director:profiles!replacement_director_id (
            full_name,
            phone,
            email
          )
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingRequests(data || []);
    } catch (error) {
      console.error('Error fetching existing requests:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedDirector || !reason.trim()) {
      toast.error('Por favor selecciona un director y proporciona una razón');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Validar que el director seleccionado exista en la lista disponible
      const selectedDir = availableDirectors.find(d => d.id === selectedDirector);
      if (!selectedDir) {
        toast.error('Selecciona un director válido');
        setIsLoading(false);
        return;
      }

      // Buscar si el director seleccionado tiene cuenta en profiles (por email, case-insensitive)
      const { data: replacementProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', selectedDir.email)
        .maybeSingle();

      if (!replacementProfile) {
        toast.error(`El director ${selectedDir.full_name} no tiene cuenta en el sistema. Debe crear una cuenta primero para recibir solicitudes.`);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('director_replacement_requests')
        .insert({
          service_id: serviceId,
          original_director_id: user.id,
          replacement_director_id: replacementProfile.id,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification for the replacement director
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: replacementProfile.id,
          sender_id: user.id,
          type: 'director_replacement_request',
          title: 'Solicitud de Reemplazo de Director',
          message: `Se te ha solicitado dirigir el servicio "${serviceTitle}" el ${format(new Date(serviceDate), 'dd/MM/yyyy', { locale: es })}.`,
          metadata: {
            service_id: serviceId,
            service_title: serviceTitle,
            service_date: serviceDate,
            reason: reason
          }
        });

      toast.success('Solicitud de reemplazo enviada exitosamente');
      setShowRequestForm(false);
      setSelectedDirector('');
      setReason('');
      fetchExistingRequests();
      onRequestCreated?.();
    } catch (error) {
      console.error('Error creating replacement request:', error);
      toast.error('Error al crear la solicitud de reemplazo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestForm = () => {
    setShowRequestForm(true);
    // Reiniciar selección para evitar IDs obsoletos
    setSelectedDirector('');
    fetchAvailableDirectors();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aceptado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><AlertTriangle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasPendingRequest = existingRequests.some(req => req.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Create Request Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Solicitar Reemplazo de Director
          </CardTitle>
          <CardDescription>
            Solicita a otro director que dirija este servicio en tu lugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showRequestForm ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Servicio actual:</div>
                <div className="font-medium">{serviceTitle}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {format(new Date(serviceDate), 'dd/MM/yyyy', { locale: es })} - Dirigido por: {currentDirector}
                </div>
              </div>
              
              <Button 
                onClick={handleRequestForm}
                disabled={hasPendingRequest}
                className="w-full"
              >
                {hasPendingRequest ? 'Ya tienes una solicitud pendiente' : 'Solicitar Reemplazo'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Director de Reemplazo</label>
                <Select value={selectedDirector} onValueChange={setSelectedDirector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un director disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDirectors.map((director) => (
                      <SelectItem key={director.id} value={director.id}>
                        <div>
                          <div className="font-medium">{director.full_name}</div>
                          <div className="text-sm text-gray-500">{director.phone} - {director.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Razón del reemplazo</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explica brevemente por qué necesitas un reemplazo..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateRequest} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
                <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Requests */}
      {existingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Reemplazo</CardTitle>
            <CardDescription>
              Historial de solicitudes para este servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{request.replacement_director.full_name}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Teléfono: {request.replacement_director.phone}</div>
                        <div>Email: {request.replacement_director.email}</div>
                      </div>
                      <div className="text-sm">
                        <strong>Razón:</strong> {request.reason}
                      </div>
                      {request.notes && (
                        <div className="text-sm">
                          <strong>Notas:</strong> {request.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Solicitado: {format(new Date(request.requested_at), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                      {request.responded_at && (
                        <div>Respondido: {format(new Date(request.responded_at), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                      )}
                      {request.status === 'pending' && (
                        <div className="text-yellow-600 mt-1">
                          Expira: {format(new Date(request.expires_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DirectorChangeRequest;
