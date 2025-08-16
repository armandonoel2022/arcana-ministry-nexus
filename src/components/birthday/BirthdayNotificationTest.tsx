import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BirthdayNotificationTest = () => {
  const [sendingMonthly, setSendingMonthly] = useState(false);
  const [sendingDaily, setSendingDaily] = useState(false);
  const { toast } = useToast();

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
    setSendingDaily(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-birthday-notifications');
      
      if (error) throw error;

      if (data.birthday_members === 0) {
        toast({
          title: "ℹ️ Sin cumpleaños hoy",
          description: "No hay integrantes que cumplan años hoy",
        });
      } else {
        toast({
          title: "✅ Notificaciones diarias enviadas",
          description: `Se enviaron ${data.notifications_sent} notificaciones para ${data.birthday_members} cumpleaños de hoy: ${data.birthdays.join(', ')}`,
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
              Envía notificaciones de cumpleaños del día actual.
            </p>
            <Button 
              onClick={testDailyNotifications}
              disabled={sendingDaily}
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