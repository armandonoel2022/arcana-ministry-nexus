import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Users, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  title: string;
  service_date: string;
  leader: string;
  assigned_group_id: string | null;
  worship_groups?: {
    id: string;
    name: string;
    color_theme: string;
  };
}

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url: string | null;
  voz_instrumento: string | null;
  grupo: string | null;
  cargo: string;
}

interface GroupMember {
  id: string;
  name: string;
  voice: string;
  role: string;
  mic: string;
  photo_url: string;
}

interface VoiceRequest {
  id: string;
  service_id: string;
  original_member_id: string;
  replacement_member_id: string;
  group_name: string;
  voice_type: string | null;
  mic_position: number | null;
  reason: string | null;
  notes: string | null;
  status: string;
  requested_at: string;
  expires_at: string | null;
}

// Member IDs from ServiceNotificationOverlay
const MEMBER_IDS: Record<string, string> = {
  FELIX_NICOLAS: "3d75bc74-76bb-454a-b3e0-d6e4de45d577",
  ARMANDO_NOEL: "d6602109-ad3e-4db6-ab4a-2984dadfc569",
  GUARIONEX_GARCIA: "a71697a2-bf8e-4967-8190-2e3e2d01f150",
  FREDDERID_ABRAHAN: "7a1645d8-75fe-498c-a2e9-f1057ff3521f",
  DENNY_ALBERTO: "6a5bfaa9-fdf0-4b0e-aad3-79266444604f",
  ARIZONI_LIRIANO: "4eed809d-9437-48d5-935e-cf8b4aa8024a",
  MARIA_SANTANA: "1d5866c9-cdc1-439e-976a-2d2e6a5aef80",
  ROSELY_MONTERO: "2a2fa0cd-d301-46ec-9965-2e4ea3692181",
  ALEIDA_BATISTA: "00a916a8-ab94-4cc0-81ae-668dd6071416",
  ELIABI_JOANA: "c4089748-7168-4472-8e7c-bf44b4355906",
  FIOR_DALIZA: "8cebc294-ea61-40d0-9b04-08d7d474332c",
  RUTH_ESMAILIN: "619c1a4e-42db-4549-8890-16392cfa2a87",
  KEYLA_YANIRA: "c24659e9-b473-4ecd-97e7-a90526d23502",
  YINDHIA_CAROLINA: "11328db1-559f-4dcf-9024-9aef18435700",
  AIDA_LORENA: "82b62449-5046-455f-af7b-da8e5dbc6327",
  SUGEY_GONZALEZ: "be61d066-5707-4763-8d8c-16d19597dc3a",
  DAMARIS_CASTILLO: "cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38",
  JISELL_AMADA: "b5719097-187d-4804-8b7f-e84cc1ec9ad5",
  RODES_ESTHER: "bdcc27cd-40ae-456e-a340-633ce7da08c0",
};

const ALL_MEMBERS: Record<string, { name: string; voice: string; photo_url: string }> = {
  [MEMBER_IDS.ALEIDA_BATISTA]: { name: "Aleida Geomar Batista Ventura", voice: "Soprano", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/00a916a8-ab94-4cc0-81ae-668dd6071416.JPG" },
  [MEMBER_IDS.ELIABI_JOANA]: { name: "Eliabi Joana Sierra Castillo", voice: "Soprano", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c4089748-7168-4472-8e7c-bf44b4355906.JPG" },
  [MEMBER_IDS.FELIX_NICOLAS]: { name: "Félix Nicolás Peralta Hernández", voice: "Tenor", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/f36d35a3-aa9c-4bd6-9b1a-ca1dd4326e3f.JPG" },
  [MEMBER_IDS.ARMANDO_NOEL]: { name: "Armando Noel Charle", voice: "Tenor", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG" },
  [MEMBER_IDS.FIOR_DALIZA]: { name: "Fior Daliza Paniagua", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/8cebc294-ea61-40d0-9b04-08d7d474332c.JPG" },
  [MEMBER_IDS.RUTH_ESMAILIN]: { name: "Ruth Esmailin Ramirez", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/619c1a4e-42db-4549-8890-16392cfa2a87.JPG" },
  [MEMBER_IDS.KEYLA_YANIRA]: { name: "Keyla Yanira Medrano Medrano", voice: "Soprano", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c24659e9-b473-4ecd-97e7-a90526d23502.JPG" },
  [MEMBER_IDS.YINDHIA_CAROLINA]: { name: "Yindhia Carolina Santana Castillo", voice: "Soprano", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/11328db1-559f-4dcf-9024-9aef18435700.JPG" },
  [MEMBER_IDS.ARIZONI_LIRIANO]: { name: "Arizoni Liriano Medina", voice: "Bajo", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/4eed809d-9437-48d5-935e-cf8b4aa8024a.png" },
  [MEMBER_IDS.DENNY_ALBERTO]: { name: "Denny Alberto Santana", voice: "Bajo", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/6a5bfaa9-fdf0-4b0e-aad3-79266444604f.JPG" },
  [MEMBER_IDS.AIDA_LORENA]: { name: "Aida Lorena Pacheco De Santana", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/82b62449-5046-455f-af7b-da8e5dbc6327.JPG" },
  [MEMBER_IDS.SUGEY_GONZALEZ]: { name: "Sugey A. González Garó", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG" },
  [MEMBER_IDS.DAMARIS_CASTILLO]: { name: "Damaris Castillo Jimenez", voice: "Soprano", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38.JPG" },
  [MEMBER_IDS.JISELL_AMADA]: { name: "Jisell Amada Mauricio Paniagua", voice: "Soprano", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/b5719097-187d-4804-8b7f-e84cc1ec9ad5.JPG" },
  [MEMBER_IDS.GUARIONEX_GARCIA]: { name: "Guarionex Garcia", voice: "Tenor", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/a71697a2-bf8e-4967-8190-2e3e2d01f150.JPG" },
  [MEMBER_IDS.FREDDERID_ABRAHAN]: { name: "Fredderid Abrahan Valera Montoya", voice: "Tenor", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/7a1645d8-75fe-498c-a2e9-f1057ff3521f.JPG" },
  [MEMBER_IDS.MARIA_SANTANA]: { name: "Maria del A. Santana", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/1d5866c9-cdc1-439e-976a-2d2e6a5aef80.jpeg" },
  [MEMBER_IDS.ROSELY_MONTERO]: { name: "Rosely Montero", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/2a2fa0cd-d301-46ec-9965-2e4ea3692181.jpeg" },
  [MEMBER_IDS.RODES_ESTHER]: { name: "Rodes Esther Santana Cuesta", voice: "Contralto", photo_url: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/bdcc27cd-40ae-456e-a340-633ce7da08c0.JPG" },
};

// Group configurations - First member is the Director de Alabanza for that group
const GROUP_MEMBERS_CONFIG: Record<string, string[]> = {
  // Grupo de Aleida: Eliabi Joana es Directora de Alabanza, Aleida es líder de grupo pero corista
  "Grupo de Aleida": [MEMBER_IDS.ELIABI_JOANA, MEMBER_IDS.ALEIDA_BATISTA, MEMBER_IDS.FELIX_NICOLAS, MEMBER_IDS.FIOR_DALIZA, MEMBER_IDS.RUTH_ESMAILIN],
  // Grupo de Keyla: Keyla es Directora de Alabanza y líder
  "Grupo de Keyla": [MEMBER_IDS.KEYLA_YANIRA, MEMBER_IDS.YINDHIA_CAROLINA, MEMBER_IDS.ARIZONI_LIRIANO, MEMBER_IDS.AIDA_LORENA, MEMBER_IDS.SUGEY_GONZALEZ],
  // Grupo de Massy: Damaris (Massy) es Directora de Alabanza y líder
  "Grupo de Massy": [MEMBER_IDS.DAMARIS_CASTILLO, MEMBER_IDS.JISELL_AMADA, MEMBER_IDS.FREDDERID_ABRAHAN, MEMBER_IDS.ROSELY_MONTERO, MEMBER_IDS.RODES_ESTHER],
};

const VoiceReplacementRequest = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedReplacement, setSelectedReplacement] = useState<string>('');
  const [reason, setReason] = useState('');
  const [pendingRequests, setPendingRequests] = useState<VoiceRequest[]>([]);
  const [myRequests, setMyRequests] = useState<VoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignedGroup, setAssignedGroup] = useState<string | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<GroupMember[]>([]);
  const [availableReplacements, setAvailableReplacements] = useState<GroupMember[]>([]);
  const [replacementWarning, setReplacementWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadServiceGroupAssignment(selectedService);
    } else {
      setAssignedGroup(null);
      setAssignedMembers([]);
      setAvailableReplacements([]);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedReplacement) {
      checkReplacementAvailability(selectedReplacement);
    } else {
      setReplacementWarning(null);
    }
  }, [selectedReplacement, selectedService]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch upcoming services with group info
      const today = new Date().toISOString().split('T')[0];
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          *,
          worship_groups (id, name, color_theme)
        `)
        .gte('service_date', today)
        .order('service_date', { ascending: true })
        .limit(20);
      
      setServices(servicesData || []);

      // Fetch all members from members table
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('nombres');
      
      setMembers(membersData || []);

      // Fetch pending requests
      const { data: pendingData } = await supabase
        .from('voice_replacement_requests')
        .select('*')
        .eq('status', 'pending');

      setPendingRequests(pendingData || []);

      // Fetch user's requests
      if (user) {
        const { data: myRequestsData } = await supabase
          .from('voice_replacement_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        setMyRequests(myRequestsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceGroupAssignment = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const groupName = service.worship_groups?.name || null;
    setAssignedGroup(groupName);

    if (groupName && GROUP_MEMBERS_CONFIG[groupName]) {
      // Get assigned members for this group
      const memberIds = GROUP_MEMBERS_CONFIG[groupName];
      const assigned: GroupMember[] = memberIds
        .filter(id => ALL_MEMBERS[id])
        .map((id, index) => ({
          id,
          name: ALL_MEMBERS[id].name,
          voice: ALL_MEMBERS[id].voice,
          role: index === 0 ? 'Director/a de Alabanza' : 'Corista',
          mic: `Micrófono #${index + 1}`,
          photo_url: ALL_MEMBERS[id].photo_url,
        }));
      setAssignedMembers(assigned);

      // Get available replacements - prioritize resting groups, then include assigned members as last option
      const allGroupNames = Object.keys(GROUP_MEMBERS_CONFIG);
      const restingGroups = allGroupNames.filter(g => g !== groupName);
      
      // First: members from resting groups (best options)
      const restingIds: string[] = [];
      restingGroups.forEach(g => {
        GROUP_MEMBERS_CONFIG[g].forEach(id => {
          if (!restingIds.includes(id)) {
            restingIds.push(id);
          }
        });
      });

      const restingMembers: GroupMember[] = restingIds
        .filter(id => ALL_MEMBERS[id])
        .map(id => ({
          id,
          name: ALL_MEMBERS[id].name,
          voice: ALL_MEMBERS[id].voice,
          role: 'Disponible (Descansa)',
          mic: '',
          photo_url: ALL_MEMBERS[id].photo_url,
        }));
      
      // Second: members from assigned group (less ideal - they're already singing)
      const assignedIds = memberIds.filter(id => ALL_MEMBERS[id]);
      const assignedAsLastOption: GroupMember[] = assignedIds
        .map(id => ({
          id,
          name: ALL_MEMBERS[id].name,
          voice: ALL_MEMBERS[id].voice,
          role: 'Asignado (Ya canta ese día)',
          mic: '',
          photo_url: ALL_MEMBERS[id].photo_url,
        }));

      // Combine: resting first, then assigned as last option
      setAvailableReplacements([...restingMembers, ...assignedAsLastOption]);
    } else {
      setAssignedMembers([]);
      setAvailableReplacements([]);
    }
  };

  const checkReplacementAvailability = async (replacementId: string) => {
    if (!selectedService) return;

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    // Check if the replacement is already assigned to sing on the same day
    const serviceDate = service.service_date.split('T')[0];
    const sameDayServices = services.filter(s => s.service_date.split('T')[0] === serviceDate);

    for (const s of sameDayServices) {
      const groupName = s.worship_groups?.name;
      if (groupName && GROUP_MEMBERS_CONFIG[groupName]) {
        if (GROUP_MEMBERS_CONFIG[groupName].includes(replacementId)) {
          const replacementName = ALL_MEMBERS[replacementId]?.name || 'Este corista';
          setReplacementWarning(`⚠️ ${replacementName} ya está asignado/a para hacer coros en el servicio de ${s.title} el mismo día.`);
          return;
        }
      }
    }
    setReplacementWarning(null);
  };

  const handleSubmitRequest = async () => {
    if (!selectedService || !selectedMember || !selectedReplacement || !assignedGroup) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      const selectedMemberInfo = assignedMembers.find(m => m.id === selectedMember);
      
      const { error } = await supabase
        .from('voice_replacement_requests')
        .insert({
          service_id: selectedService,
          original_member_id: selectedMember,
          replacement_member_id: selectedReplacement,
          group_name: assignedGroup,
          voice_type: selectedMemberInfo?.voice || null,
          mic_position: selectedMemberInfo ? parseInt(selectedMemberInfo.mic.replace(/\D/g, '')) : null,
          reason: reason || null,
          status: 'pending',
          expires_at: addDays(new Date(), 1).toISOString()
        });

      if (error) throw error;

      toast.success('Solicitud de reemplazo enviada');
      
      // Reset form
      setSelectedService('');
      setSelectedMember('');
      setSelectedReplacement('');
      setReason('');
      setAssignedGroup(null);
      setAssignedMembers([]);
      setAvailableReplacements([]);
      
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
        .from('voice_replacement_requests')
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

  const getMemberNameById = (memberId: string) => {
    return ALL_MEMBERS[memberId]?.name || 'Desconocido';
  };

  const getServiceInfo = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Servicio desconocido';
    return `${service.title} - ${format(new Date(service.service_date), "EEEE d 'de' MMMM", { locale: es })}`;
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
          <CardDescription>
            Selecciona el servicio para ver los coristas asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona el servicio" />
            </SelectTrigger>
            <SelectContent>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex items-center gap-2">
                    <span>{service.title}</span>
                    <span className="text-muted-foreground">
                      - {format(new Date(service.service_date), "EEE d MMM", { locale: es })}
                    </span>
                    {service.worship_groups?.name && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {service.worship_groups.name}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Assigned Group Members */}
      {assignedGroup && assignedMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              {assignedGroup} - Asignados
            </CardTitle>
            <CardDescription>
              Selecciona el corista que necesita reemplazo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {assignedMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    selectedMember === member.id 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarImage src={member.photo_url} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                  <p className="text-xs text-muted-foreground">{member.voice}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{member.mic}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Replacements */}
      {selectedMember && availableReplacements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              Coristas Disponibles para Reemplazo
            </CardTitle>
            <CardDescription>
              Selecciona quién hará el reemplazo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {replacementWarning && (
              <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  {replacementWarning}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarImage src={member.photo_url} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs line-clamp-2">{member.name.split(' ').slice(0, 2).join(' ')}</p>
                  <p className="text-xs text-muted-foreground">{member.voice}</p>
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
                <strong>Resumen:</strong> {getMemberNameById(selectedMember)} será reemplazado/a por{' '}
                <strong>{getMemberNameById(selectedReplacement)}</strong> en {assignedGroup}
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
                    <p className="font-medium">{getServiceInfo(request.service_id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getMemberNameById(request.original_member_id)} solicita que le reemplaces
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Grupo: {request.group_name} {request.voice_type && `• Voz: ${request.voice_type}`}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespondToRequest(request.id, 'accepted')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespondToRequest(request.id, 'rejected')}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Requests */}
      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Mis Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRequests.map(request => (
              <div key={request.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{getServiceInfo(request.service_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    Reemplazo: {getMemberNameById(request.replacement_member_id)} • {request.group_name}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceReplacementRequest;
