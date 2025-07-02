
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NotificationTestButton = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const testNotification = async () => {
    setSending(true);
    try {
      // Crear una notificación de prueba en la base de datos
      const { error } = await supabase
        .from('system_notifications')
        .insert({
          type: 'test',
          title: 'Notificación de Prueba',
          message: 'Esta es una notificación de prueba enviada por el administrador.',
          recipient_id: null, // null significa que es para todos
        });

      if (error) throw error;

      toast({
        title: "Notificación enviada",
        description: "La notificación de prueba ha sido enviada exitosamente.",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación de prueba.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={testNotification}
      disabled={sending}
      className="flex items-center gap-2"
    >
      <Bell className="w-4 h-4" />
      {sending ? 'Enviando...' : 'Probar Notificación'}
    </Button>
  );
};

export default NotificationTestButton;
