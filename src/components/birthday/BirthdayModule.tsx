import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Calendar, Gift, Bell, Users, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isSameDay, parseISO, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import BirthdayCard from './BirthdayCard';
import BirthdayNotificationTest from './BirthdayNotificationTest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  fecha_nacimiento?: string;
  is_active: boolean;
}

const BirthdayModule = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showThisMonthOnly, setShowThisMonthOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, members, showThisMonthOnly]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'administrator');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, nombres, apellidos, photo_url, cargo, fecha_nacimiento, is_active')
        .eq('is_active', true)
        .not('fecha_nacimiento', 'is', null)
        .order('nombres', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los integrantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members.filter(member =>
      member.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrar por mes actual si está activado (usando fecha en zona horaria RD)
    if (showThisMonthOnly) {
      const tzMonth = (() => {
        const str = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' });
        const [, m] = str.split('-');
        return Number(m) - 1;
      })();
      filtered = filtered.filter(member => {
        const parts = getDateParts(member.fecha_nacimiento);
        return parts ? (parts.m - 1) === tzMonth : false;
      });
    }

    // Ordenar por mes y día de cumpleaños usando valores crudos del string
    filtered = filtered.sort((a, b) => {
      const dateA = getDateParts(a.fecha_nacimiento);
      const dateB = getDateParts(b.fecha_nacimiento);
      if (!dateA || !dateB) return 0;
      const monthDiff = dateA.m - dateB.m; // m es 1-12
      if (monthDiff !== 0) return monthDiff;
      return dateA.d - dateB.d;
    });

    setFilteredMembers(filtered);
  };

  // Parse 'YYYY-MM-DD' como fecha local (sin zona horaria)
  const parseDateOnly = (dateStr?: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  // Obtener partes numéricas exactas desde el string de base de datos
  const getDateParts = (dateStr?: string): { y: number; m: number; d: number } | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d) return null;
    return { y, m, d };
  };

  const isBirthdayToday = (birthDate: string) => {
    const birth = parseDateOnly(birthDate);
    if (!birth) return false;

    // Obtener día y mes actuales en zona horaria de República Dominicana
    const todayStr = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [, monthStr, dayStr] = todayStr.split('-');
    const tzMonth = Number(monthStr) - 1;
    const tzDay = Number(dayStr);

    return tzMonth === birth.getMonth() && tzDay === birth.getDate();
  };

  const getNextBirthday = (birthDate: string) => {
    const birth = parseDateOnly(birthDate);
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!birth) return localToday;

    // Crear fecha del cumpleaños en el año actual SIN zona horaria
    const thisYear = new Date(localToday.getFullYear(), birth.getMonth(), birth.getDate(), 12, 0, 0);
    if (thisYear < localToday) {
      return new Date(localToday.getFullYear() + 1, birth.getMonth(), birth.getDate(), 12, 0, 0);
    }
    return thisYear;
  };

  const generateBirthdayCard = (member: Member) => {
    setSelectedMember(member);
    setCardDialogOpen(true);
  };

  const sendBirthdayNotification = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .insert({
          type: 'general',
          title: `🎉 ¡Cumpleaños de ${member.nombres}!`,
          message: `Hoy es el cumpleaños de ${member.nombres} ${member.apellidos} (${getRoleLabel(member.cargo)}). ¡Felicitémosle en este día especial!`,
          notification_category: 'birthday',
          priority: 2,
          metadata: {
            member_id: member.id,
            birthday_member_name: `${member.nombres} ${member.apellidos}`,
            birthday_member_photo: member.photo_url,
            member_role: member.cargo,
            birthday_date: new Date().toISOString().split('T')[0],
            birthday: true,
            show_confetti: true,
            play_birthday_sound: true
          }
        });

      if (error) throw error;

      toast({
        title: "¡Notificación enviada!",
        description: `Se ha enviado la notificación de cumpleaños de ${member.nombres} a todos los integrantes`,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación de cumpleaños",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'pastor': 'Pastor',
      'pastora': 'Pastora',
      'director_alabanza': 'Director de Alabanza',
      'directora_alabanza': 'Directora de Alabanza',
      'director_musical': 'Director Musical',
      'corista': 'Corista',
      'directora_danza': 'Directora de Danza',
      'director_multimedia': 'Director Multimedia',
      'camarografo': 'Camarógrafo',
      'camarógrafa': 'Camarógrafa',
      'encargado_piso': 'Encargado de Piso',
      'encargada_piso': 'Encargada de Piso',
      'musico': 'Músico',
      'sonidista': 'Sonidista',
      'encargado_luces': 'Encargado de Luces',
      'encargado_proyeccion': 'Encargado de Proyección',
      'encargado_streaming': 'Encargado de Streaming'
    };
    return roleLabels[role] || role;
  };

  const todaysBirthdays = filteredMembers.filter(member => 
    member.fecha_nacimiento && isBirthdayToday(member.fecha_nacimiento)
  );

  const upcomingBirthdays = filteredMembers.filter(member => 
    member.fecha_nacimiento && !isBirthdayToday(member.fecha_nacimiento)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcana-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando cumpleaños...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Módulo de Cumpleaños
            </h1>
            <p className="text-gray-600">
              Genera tarjetas profesionales y envía notificaciones de cumpleaños
            </p>
          </div>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar integrante por nombre o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowThisMonthOnly(!showThisMonthOnly)}
            variant={showThisMonthOnly ? "default" : "outline"}
            className={showThisMonthOnly ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            Solo este mes
          </Button>
          <Badge variant="secondary" className="bg-arcana-blue-50 text-arcana-blue-600">
            {filteredMembers.length} cumpleaños
          </Badge>
        </div>
      </div>

      {/* Cumpleaños de hoy */}
      {todaysBirthdays.length > 0 && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Gift className="w-5 h-5" />
              🎉 Cumpleaños de Hoy ({todaysBirthdays.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysBirthdays.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-yellow-200">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-yellow-300">
                      <AvatarImage
                        src={member.photo_url || undefined}
                        alt={`${member.nombres} ${member.apellidos}`}
                      />
                      <AvatarFallback className="bg-yellow-gradient text-white text-lg">
                        {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-yellow-700">
                        {member.nombres} {member.apellidos}
                      </h3>
                      <p className="text-yellow-600">{getRoleLabel(member.cargo)}</p>
                      <Badge className="bg-yellow-500 text-white text-xs">
                        🎂 ¡Cumpleaños hoy!
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => generateBirthdayCard(member)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Generar Tarjeta
                    </Button>
                    <Button
                      onClick={() => sendBirthdayNotification(member)}
                      variant="outline"
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notificar
                    </Button>
                    <Button
                      onClick={() => {
                        // Trigger overlay test with custom event
                        window.dispatchEvent(new CustomEvent('testBirthdayOverlay', { detail: member }));
                        toast({
                          title: "Overlay activado",
                          description: "El overlay de cumpleaños debería aparecer ahora",
                        });
                      }}
                      variant="outline"
                      className="border-purple-500 text-purple-600 hover:bg-purple-50"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Probar Overlay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel de pruebas para administradores - siempre visible para debugging */}
      <BirthdayNotificationTest />

      {/* Cumpleaños de hoy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximos Cumpleaños ({upcomingBirthdays.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBirthdays.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay próximos cumpleaños registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={member.photo_url || undefined}
                        alt={`${member.nombres} ${member.apellidos}`}
                      />
                      <AvatarFallback className="bg-arcana-blue-gradient text-white">
                        {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{member.nombres} {member.apellidos}</h4>
                      <p className="text-sm text-gray-600">{getRoleLabel(member.cargo)}</p>
                      {member.fecha_nacimiento && (() => {
                        const birth = parseDateOnly(member.fecha_nacimiento);
                        if (!birth) return null;
                        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                        return (
                          <p className="text-xs text-gray-500">
                            {birth.getDate()} de {monthNames[birth.getMonth()]}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => generateBirthdayCard(member)}
                      variant="outline"
                      size="sm"
                    >
                      <Gift className="w-4 h-4 mr-1" />
                      Tarjeta
                    </Button>
                    <Button
                      onClick={() => sendBirthdayNotification(member)}
                      variant="outline"
                      size="sm"
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      Notificar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para mostrar la tarjeta de cumpleaños */}
      <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tarjeta de Cumpleaños</DialogTitle>
            <DialogDescription>
              Tarjeta profesional para {selectedMember?.nombres} {selectedMember?.apellidos}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <BirthdayCard 
              member={selectedMember} 
              onDownload={() => setCardDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BirthdayModule;