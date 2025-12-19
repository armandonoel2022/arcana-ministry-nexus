import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Monitor, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Camera, Video, Projector } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  title: string;
  service_date: string;
}

interface MultimediaMember {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  photo_url: string;
}

// Multimedia staff data
const MULTIMEDIA_STAFF: MultimediaMember[] = [
  {
    id: "luis-marte",
    name: "Luis Alberto Marte Batista",
    role: "director_multimedia",
    roleLabel: "Director Multimedia",
    photo_url: ""
  },
  {
    id: "camila-marte",
    name: "Camila Marie Marte Martínez",
    role: "encargado_proyeccion",
    roleLabel: "Encargada de Proyección",
    photo_url: ""
  },
  {
    id: "enger-santana",
    name: "Enger Julio F. Santana",
    role: "encargado_proyeccion",
    roleLabel: "Encargado de Proyección",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/56792791-3bf6-46ea-8421-0e1e0f3c983a.JPG"
  },
  {
    id: "katherine-lorenzo",
    name: "Katherine Orquidea Lorenzo Rosario",
    role: "encargado_proyeccion",
    roleLabel: "Encargada de Proyección",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/6543ab9d-404f-4eb6-ba1a-b948e58952fa.JPG"
  },
  {
    id: "robert-caraballo",
    name: "Robert Caraballo",
    role: "encargado_proyeccion",
    roleLabel: "Encargado de Proyección",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/880d8dc5-ec1d-470a-a765-53101230edb6.jpeg"
  },
  {
    id: "delvin-sanchez",
    name: "Delvin Josue Sánchez Ramírez",
    role: "encargado_streaming",
    roleLabel: "Encargado de Streaming",
    photo_url: ""
  },
  {
    id: "jose-henriquez",
    name: "José Ramón Henríquez Toribio",
    role: "encargado_streaming",
    roleLabel: "Encargado de Streaming",
    photo_url: ""
  },
  {
    id: "wilton-gomez",
    name: "Wilton Gómez Portes",
    role: "camarografo",
    roleLabel: "Camarógrafo",
    photo_url: ""
  },
  {
    id: "harold-pinales",
    name: "Harold Javier Pinales Mora",
    role: "camarografo",
    roleLabel: "Camarógrafo",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/28fd6473-5fed-415d-b082-314724875b9a.JPG"
  },
  {
    id: "mayker-martinez",
    name: "Mayker Martínez Lara",
    role: "camarografo",
    roleLabel: "Camarógrafo",
    photo_url: ""
  },
  {
    id: "iham-francisco",
    name: "Iham Francisco",
    role: "camarografo",
    roleLabel: "Camarógrafo",
    photo_url: ""
  }
];

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'director_multimedia': return Monitor;
    case 'encargado_proyeccion': return Projector;
    case 'encargado_streaming': return Video;
    case 'camarografo': return Camera;
    default: return Monitor;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'director_multimedia': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'encargado_proyeccion': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'encargado_streaming': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'camarografo': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const MultimediaReplacementRequest = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedReplacement, setSelectedReplacement] = useState<string>('');
  const [reason, setReason] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString();
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .gte('service_date', today)
        .order('service_date', { ascending: true })
        .limit(20);
      
      setServices(servicesData || []);

      const { data: requestsData } = await supabase
        .from('multimedia_replacement_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const pending = (requestsData || []).filter(r => r.status === 'pending');
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedService || !selectedMember || !selectedReplacement) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const member = MULTIMEDIA_STAFF.find(m => m.id === selectedMember);

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('multimedia_replacement_requests')
        .insert({
          service_id: selectedService,
          original_member_id: selectedMember,
          replacement_member_id: selectedReplacement,
          role: member?.roleLabel || 'Multimedia',
          reason: reason || null,
          status: 'pending',
          expires_at: addDays(new Date(), 1).toISOString()
        });

      if (error) throw error;

      toast.success('Solicitud de reemplazo enviada');
      setSelectedService('');
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

  const getMemberName = (id: string) => {
    return MULTIMEDIA_STAFF.find(m => m.id === id)?.name || 'Desconocido';
  };

  const selectedMemberData = MULTIMEDIA_STAFF.find(m => m.id === selectedMember);
  
  // Get available replacements (same role members, excluding selected)
  const availableReplacements = selectedMemberData 
    ? MULTIMEDIA_STAFF.filter(m => m.role === selectedMemberData.role && m.id !== selectedMember)
    : [];

  // Group staff by role for display
  const groupedStaff = {
    director: MULTIMEDIA_STAFF.filter(m => m.role === 'director_multimedia'),
    proyeccion: MULTIMEDIA_STAFF.filter(m => m.role === 'encargado_proyeccion'),
    streaming: MULTIMEDIA_STAFF.filter(m => m.role === 'encargado_streaming'),
    camarografos: MULTIMEDIA_STAFF.filter(m => m.role === 'camarografo'),
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
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Seleccionar Servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-full">
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
        </CardContent>
      </Card>

      {/* Staff by Category */}
      {selectedService && (
        <div className="space-y-4">
          {/* Director */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="w-4 h-4 text-purple-500" />
                Director Multimedia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupedStaff.director.map(member => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member.id);
                        setSelectedReplacement('');
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        selectedMember === member.id 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={member.photo_url} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                      <Badge className={`text-[10px] mt-1 ${getRoleColor(member.role)}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        Director
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Proyección */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Projector className="w-4 h-4 text-blue-500" />
                Proyección
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupedStaff.proyeccion.map(member => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member.id);
                        setSelectedReplacement('');
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        selectedMember === member.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={member.photo_url} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                      <Badge className={`text-[10px] mt-1 ${getRoleColor(member.role)}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        Proyección
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Streaming */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="w-4 h-4 text-green-500" />
                Streaming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupedStaff.streaming.map(member => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member.id);
                        setSelectedReplacement('');
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        selectedMember === member.id 
                          ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={member.photo_url} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                      <Badge className={`text-[10px] mt-1 ${getRoleColor(member.role)}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        Streaming
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Camarógrafos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="w-4 h-4 text-orange-500" />
                Camarógrafos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {groupedStaff.camarografos.map(member => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member.id);
                        setSelectedReplacement('');
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        selectedMember === member.id 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' 
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={member.photo_url} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                      <Badge className={`text-[10px] mt-1 ${getRoleColor(member.role)}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        Cámara
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Replacements */}
      {selectedMember && availableReplacements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              Personal Disponible para Reemplazo
            </CardTitle>
            <CardDescription>
              Selecciona quién hará el reemplazo de {selectedMemberData?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableReplacements.map(member => (
                <div
                  key={member.id}
                  onClick={() => setSelectedReplacement(member.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    selectedReplacement === member.id 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarImage src={member.photo_url} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reason and Submit */}
      {selectedMember && selectedReplacement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Enviar Solicitud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Resumen:</strong> {getMemberName(selectedMember)} ({selectedMemberData?.roleLabel}) será reemplazado/a por{' '}
                <strong>{getMemberName(selectedReplacement)}</strong>
              </p>
            </div>

            <Button 
              onClick={handleSubmitRequest} 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Solicitud de Reemplazo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
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
