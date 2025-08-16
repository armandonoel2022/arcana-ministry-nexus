import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
}

const BirthdayNotificationTest = () => {
  const [sendingMonthly, setSendingMonthly] = useState(false);
  const [sendingDaily, setSendingDaily] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, nombres, apellidos, fecha_nacimiento')
        .eq('is_active', true)
        .not('fecha_nacimiento', 'is', null)
        .order('nombres', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const testMonthlyNotifications = async () => {
    setSendingMonthly(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-monthly-birthday-notifications');
      
      if (error) throw error;

      toast({
        title: "✅ Notificaciones mensuales enviadas",
        description: `Se enviaron ${data.notifications_sent} notificaciones para ${data.birthday_count} cumpleaños de ${data.month}`,
      });
    } catch (error) {
      console.error('Error testing monthly notifications:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron enviar las notificaciones mensuales",
        variant: "destructive",
      });
    } finally {
      setSendingMonthly(false);
    }
  };

  const testDailyNotifications = async () => {
    if (!selectedMemberId) {
      toast({
        title: "⚠️ Selecciona un integrante",
        description: "Debes seleccionar a la persona que cumple años para la prueba",
        variant: "destructive",
      });
      return;
    }

    setSendingDaily(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-birthday-notifications', {
        body: { birthdayMemberId: selectedMemberId }
      });
      
      if (error) throw error;

      if (data.birthday_members === 0) {
        toast({
          title: "ℹ️ Sin cumpleaños",
          description: "No se pudo procesar el cumpleaños seleccionado",
        });
      } else {
        toast({
          title: "✅ Notificaciones diarias enviadas",
          description: `Se enviaron ${data.notifications_sent} notificaciones para ${data.birthdays.join(', ')} (excluyendo al cumpleañero)`,
        });
      }
    } catch (error) {
      console.error('Error testing daily notifications:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron enviar las notificaciones diarias",
        variant: "destructive",
      });
    } finally {
      setSendingDaily(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Pruebas de Notificaciones (Solo Administradores)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Notificaciones Mensuales
            </h4>
            <p className="text-sm text-muted-foreground">
              Envía la lista de cumpleaños del mes actual a todos los usuarios.
            </p>
            <Button 
              onClick={testMonthlyNotifications}
              disabled={sendingMonthly}
              variant="outline"
              className="w-full"
            >
              {sendingMonthly ? 'Enviando...' : 'Probar Notificaciones Mensuales'}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Notificaciones Diarias
            </h4>
            <p className="text-sm text-muted-foreground">
              Selecciona un integrante para simular su cumpleaños.
            </p>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar integrante..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.nombres} {member.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={testDailyNotifications}
              disabled={sendingDaily || !selectedMemberId}
              variant="outline"
              className="w-full"
            >
              {sendingDaily ? 'Enviando...' : 'Probar Notificaciones Diarias'}
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">ℹ️ Información sobre la automatización:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Las notificaciones mensuales se envían automáticamente el día 1 de cada mes a las 7:00 AM</li>
            <li>• Las notificaciones diarias se envían automáticamente todos los días a las 8:00 AM</li>
            <li>• Si hay múltiples cumpleaños el mismo día, se envían con 1 minuto de diferencia</li>
            <li>• Solo los usuarios activos reciben las notificaciones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BirthdayNotificationTest;