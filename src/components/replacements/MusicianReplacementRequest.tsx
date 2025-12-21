import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Guitar, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, Calendar, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  title: string;
  service_date: string;
}

interface Musician {
  id: string;
  name: string;
  instrument: string;
  role: string;
  photo_url: string;
  replacements: string[];
}

// Musicians with their data and photo URLs from the members table
const MUSICIANS: Musician[] = [
  {
    id: "479ee7fd-b5cc-4a2e-8c2a-5bc7edeb46cd",
    name: "David Santana",
    instrument: "Bajo",
    role: "Director Musical",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/479ee7fd-b5cc-4a2e-8c2a-5bc7edeb46cd.JPG",
    replacements: ["e91dc0fd-f10e-4538-a2ef-ebb20d40eeed"]
  },
  {
    id: "e91dc0fd-f10e-4538-a2ef-ebb20d40eeed",
    name: "Benjamín Martínez",
    instrument: "Bajo",
    role: "Bajista suplente",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/e91dc0fd-f10e-4538-a2ef-ebb20d40eeed.JPG",
    replacements: []
  },
  {
    id: "147ba353-6c2e-45b2-8f70-b992400c5766",
    name: "José Neftalí Castillo",
    instrument: "Piano",
    role: "Pianista Principal",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/147ba353-6c2e-45b2-8f70-b992400c5766.JPG",
    replacements: ["60b1f3d9-9826-4e5c-a348-cebbdbd2a7c9", "1d5866c9-cdc1-439e-976a-2d2e6a5aef80"]
  },
  {
    id: "60b1f3d9-9826-4e5c-a348-cebbdbd2a7c9",
    name: "Roosevelt Martínez",
    instrument: "Piano",
    role: "Pastor / Suplente Piano",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/60b1f3d9-9826-4e5c-a348-cebbdbd2a7c9.JPG",
    replacements: []
  },
  {
    id: "1d5866c9-cdc1-439e-976a-2d2e6a5aef80",
    name: "María del A. Pérez Santana",
    instrument: "Piano",
    role: "Suplente Piano",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/1d5866c9-cdc1-439e-976a-2d2e6a5aef80.jpeg",
    replacements: []
  },
  {
    id: "5c511308-3a29-4ab3-84b7-9e6bddfb7dc5",
    name: "Jatniel Martínez Portes",
    instrument: "Batería",
    role: "Baterista",
    photo_url: "",
    replacements: ["7715c56e-ca85-4fbf-9647-6e6d6f312364", "2ee5d44e-1938-4df4-87b3-b3dea8b703f1"]
  },
  {
    id: "7715c56e-ca85-4fbf-9647-6e6d6f312364",
    name: "Hidekel Mateo Morillo",
    instrument: "Batería",
    role: "Baterista",
    photo_url: "",
    replacements: ["5c511308-3a29-4ab3-84b7-9e6bddfb7dc5", "2ee5d44e-1938-4df4-87b3-b3dea8b703f1"]
  },
  {
    id: "2ee5d44e-1938-4df4-87b3-b3dea8b703f1",
    name: "Alonso Núñez",
    instrument: "Batería",
    role: "Baterista",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/2ee5d44e-1938-4df4-87b3-b3dea8b703f1.png",
    replacements: ["5c511308-3a29-4ab3-84b7-9e6bddfb7dc5", "7715c56e-ca85-4fbf-9647-6e6d6f312364"]
  },
  {
    id: "fc76fca9-7a2e-457b-80c7-8cf2987c6b6c",
    name: "Gerson Daniel Sánchez Santana",
    instrument: "Guitarra Eléctrica",
    role: "Guitarrista",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/fc76fca9-7a2e-457b-80c7-8cf2987c6b6c.JPG",
    replacements: []
  },
  {
    id: "61ded9a2-d5a1-41d6-bbba-f19ba5cddf88",
    name: "Eliéser Leyba Ortiz",
    instrument: "Percusión Menor",
    role: "Percusionista",
    photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/61ded9a2-d5a1-41d6-bbba-f19ba5cddf88.png",
    replacements: []
  }
];

// Training warnings - instruments that need more musicians
const TRAINING_WARNINGS = [
  { instrument: "Guitarra Eléctrica", message: "Solo hay 1 guitarrista. Se necesita entrenar más músicos." },
  { instrument: "Piano", message: "José Neftalí es el único pianista designado. Roosevelt y María son suplentes ocasionales." },
  { instrument: "Percusión Menor", message: "Solo hay 1 percusionista. Se necesita entrenar más músicos." },
  { instrument: "Bajo", message: "Solo hay 2 bajistas. Considera entrenar más músicos." }
];

const MusicianReplacementRequest = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedMusician, setSelectedMusician] = useState<string>('');
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
        .from('musician_replacement_requests')
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
    if (!selectedService || !selectedMusician || !selectedReplacement) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const musician = MUSICIANS.find(m => m.id === selectedMusician);

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('musician_replacement_requests')
        .insert({
          service_id: selectedService,
          original_member_id: selectedMusician,
          replacement_member_id: selectedReplacement,
          instrument: musician?.instrument || 'Instrumento',
          reason: reason || null,
          status: 'pending',
          expires_at: addDays(new Date(), 1).toISOString()
        });

      if (error) throw error;

      toast.success('Solicitud de reemplazo enviada');
      setSelectedService('');
      setSelectedMusician('');
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
        .from('musician_replacement_requests')
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

  const getMusicianName = (id: string) => {
    return MUSICIANS.find(m => m.id === id)?.name || 'Desconocido';
  };

  const selectedMusicianData = MUSICIANS.find(m => m.id === selectedMusician);
  const availableReplacements = selectedMusicianData 
    ? MUSICIANS.filter(m => selectedMusicianData.replacements.includes(m.id))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Training Warnings */}
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>⚠️ Alerta de Entrenamiento:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
            {TRAINING_WARNINGS.map((warning, idx) => (
              <li key={idx}><strong>{warning.instrument}:</strong> {warning.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

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

      {/* Musicians Grid */}
      {selectedService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-500" />
              Músicos - Selecciona quién necesita reemplazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {MUSICIANS.map(musician => (
                <div
                  key={musician.id}
                  onClick={() => {
                    setSelectedMusician(musician.id);
                    setSelectedReplacement('');
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    selectedMusician === musician.id 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarImage src={musician.photo_url} alt={musician.name} />
                    <AvatarFallback className="text-xs">
                      {musician.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs line-clamp-2">{musician.name.split(' ').slice(0, 2).join(' ')}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{musician.instrument}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{musician.role}</p>
                  {musician.replacements.length === 0 && (
                    <Badge variant="destructive" className="text-[9px] mt-1">Sin reemplazo</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Replacements */}
      {selectedMusician && availableReplacements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              Músicos Disponibles para Reemplazo
            </CardTitle>
            <CardDescription>
              Selecciona quién hará el reemplazo de {selectedMusicianData?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {availableReplacements.map(musician => (
                <div
                  key={musician.id}
                  onClick={() => setSelectedReplacement(musician.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    selectedReplacement === musician.id 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarImage src={musician.photo_url} alt={musician.name} />
                    <AvatarFallback className="text-xs">
                      {musician.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs line-clamp-2">{musician.name.split(' ').slice(0, 2).join(' ')}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{musician.instrument}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Replacements Warning */}
      {selectedMusician && availableReplacements.length === 0 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>{selectedMusicianData?.name}</strong> no tiene músicos de reemplazo designados para {selectedMusicianData?.instrument}. 
            Es urgente entrenar a más músicos en este instrumento.
          </AlertDescription>
        </Alert>
      )}

      {/* Reason and Submit */}
      {selectedMusician && selectedReplacement && (
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
                <strong>Resumen:</strong> {getMusicianName(selectedMusician)} ({selectedMusicianData?.instrument}) será reemplazado/a por{' '}
                <strong>{getMusicianName(selectedReplacement)}</strong>
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
                    <p className="font-medium">{request.instrument}</p>
                    <p className="text-sm text-muted-foreground">
                      {getMusicianName(request.original_member_id)} → {getMusicianName(request.replacement_member_id)}
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

export default MusicianReplacementRequest;
