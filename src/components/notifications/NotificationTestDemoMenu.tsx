import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

const NotificationTestDemoMenu = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const insertNotificationNow = async (type: string, data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para enviar notificaciones.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('system_notifications')
      .insert({
        type: data.type,
        title: data.title,
        message: data.message,
        recipient_id: null, // null significa que es para todos
        notification_category: data.category,
        priority: data.priority || 2,
        metadata: data.metadata || {}
      });

    if (error) throw error;

    // Efecto especial para cumpleaños
    if (type === 'cumpleaños') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const triggerAllDemos = async () => {
    setLoading(true);
    try {
      // 1. Overlay de cumpleaños
      await insertNotificationNow('cumpleaños', {
        type: 'birthday_daily',
        title: '🎂 ¡Feliz Cumpleaños!',
        message: '🎉 Demostración de overlay de cumpleaños',
        category: 'birthday',
        priority: 3,
        metadata: {
          birthday_member_name: 'Sugey A. González Garó',
          birthday_member_photo: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG',
          birthday_date: new Date().toISOString().split('T')[0],
          show_confetti: true,
          play_birthday_sound: true
        }
      });

      // Esperar 2 segundos entre cada notificación
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Overlay de versículo del día
      await insertNotificationNow('versículo', {
        type: 'daily_verse',
        title: '📖 Versículo del Día',
        message: 'Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dice Jehová.',
        category: 'spiritual',
        priority: 1,
        metadata: {
          verse_text: 'Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dice Jehová.',
          verse_reference: 'Isaías 55:8 (RVR1960)'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Overlay de consejo del día
      await insertNotificationNow('consejo', {
        type: 'daily_advice',
        title: 'Técnicas de Respiración Vocal',
        message: 'La respiración diafragmática es fundamental para un canto saludable. Practica inhalar profundamente por la nariz, expandiendo tu abdomen, y exhala lentamente. Dedica 5 minutos diarios a este ejercicio para mejorar tu control vocal.',
        category: 'training',
        priority: 1
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Overlay de servicios del fin de semana
      await insertNotificationNow('servicios', {
        type: 'service_program',
        title: '🎼 Programa de Servicios',
        message: 'Se ha publicado el programa de servicios para este fin de semana.',
        category: 'agenda',
        priority: 2,
        metadata: {
          trigger_fetch: true
        }
      });

      toast({
        title: "¡Demostración completa!",
        description: "Se han enviado 4 notificaciones overlay de demostración. Deberían aparecer en el centro de notificaciones.",
      });
    } catch (error) {
      console.error('Error sending demo notifications:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la demostración de notificaciones.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Sparkles className="w-5 h-5" />
          Demostración Automática de Overlays
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          Este botón enviará automáticamente notificaciones de demostración para cada tipo de overlay:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 pl-4">
          <li>• 🎂 Overlay de Cumpleaños</li>
          <li>• 📖 Overlay de Versículo del Día</li>
          <li>• 💡 Overlay de Consejo del Día</li>
          <li>• 🎼 Overlay de Programa de Servicios</li>
        </ul>
        <Button
          onClick={triggerAllDemos}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando demostraciones...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Iniciar Demostración de Todos los Overlays
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationTestDemoMenu;
