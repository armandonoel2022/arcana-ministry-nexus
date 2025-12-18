import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Monitor, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  title: string;
  service_date: string;
}

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url: string | null;
  grupo: string | null;
}

const MultimediaReplacementRequest = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedReplacement, setSelectedReplacement] = useState<string>('');
  const [reason, setReason] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const roles = ['Cámaras', 'Sonido', 'Proyección', 'Streaming', 'Iluminación', 'Fotografía', 'Video'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch upcoming services
      const today = new Date().toISOString();
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .gte('service_date', today)
        .order('service_date', { ascending: true })
        .limit(20);
      
      setServices(servicesData || []);

      // Fetch multimedia members
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .eq('grupo', 'Multimedia')
        .order('nombres');
      
      setMembers(membersData || []);

      // Fetch requests
      const { data: requestsData } = await supabase
        .from('multimedia_replacement_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const pending = (requestsData || []).filter(r => r.status === 'pending');
      setPendingRequests(pending);
      setMyRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedService || !selectedMember || !selectedReplacement || !selectedRole) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('multimedia_replacement_requests')
        .insert({
          service_id: selectedService,
          original_member_id: selectedMember,
          replacement_member_id: selectedReplacement,
          role: selectedRole,
          reason: reason || null,
          status: 'pending',
          expires_at: addDays(new Date(), 1).toISOString()
        });

      if (error) throw error;

      toast.success('Solicitud de reemplazo enviada');
      
      // Reset form
      setSelectedService('');
      setSelectedRole('');
      setSelectedMember('');
      setSelectedReplacement('');
      setReason('');
      
      fetchData();
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('multimedia_replacement_requests')
        .update({
          status: action,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Solicitud ${action === 'accepted' ? 'aceptada' : 'rechazada'}`);
      fetchData();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Error al responder solicitud');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pendiente', color: 'text-yellow-600' },
      accepted: { variant: 'default' as const, icon: CheckCircle, label: 'Aceptada', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rechazada', color: 'text-red-600' },
      expired: { variant: 'outline' as const, icon: AlertCircle, label: 'Expirada', color: 'text-gray-500' }
    };
    const { variant, icon: Icon, label, color } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant={variant} className={`flex items-center gap-1 ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.nombres} ${member.apellidos}` : 'Desconocido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Nueva Solicitud de Reemplazo Multimedia
          </CardTitle>
          <CardDescription>
            Solicita un reemplazo para tu rol multimedia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title} - {format(new Date(service.service_date), "EEE d MMM, h:mm a", { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Miembro a Reemplazar</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el miembro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.nombres[0]}{member.apellidos[0]}
                          </AvatarFallback>
                        </Avatar>
                        {member.nombres} {member.apellidos}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reemplazo Solicitado</Label>
              <Select value={selectedReplacement} onValueChange={setSelectedReplacement} disabled={!selectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el reemplazo" />
                </SelectTrigger>
                <SelectContent>
                  {members.filter(m => m.id !== selectedMember).map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.nombres[0]}{member.apellidos[0]}
                          </AvatarFallback>
                        </Avatar>
                        {member.nombres} {member.apellidos}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Razón (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica el motivo del reemplazo..."
              className="resize-none"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmitRequest} 
            disabled={submitting || !selectedService || !selectedMember || !selectedReplacement}
            className="w-full"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Solicitud
          </Button>
        </CardContent>
      </Card>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Solicitudes Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map(request => (
              <div key={request.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {getMemberName(request.original_member_id)} → {getMemberName(request.replacement_member_id)}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRespondToRequest(request.id, 'accepted')} className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRespondToRequest(request.id, 'rejected')} className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultimediaReplacementRequest;
