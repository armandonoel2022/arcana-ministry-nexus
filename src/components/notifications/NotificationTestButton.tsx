import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, TestTube, BookOpen, Heart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NotificationTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testType, setTestType] = useState<'daily_verse' | 'custom'>('daily_verse');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [priority, setPriority] = useState('1');
  const { toast } = useToast();

  const sendDailyVerseNotification = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-verse-notification', {
        body: { test: true }
      });

      if (error) throw error;

      toast({
        title: "Notificación enviada",
        description: "Se ha enviado la notificación de prueba del versículo diario"
      });
    } catch (error) {
      console.error('Error sending daily verse notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación de prueba",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendCustomNotification = async () => {
    if (!customTitle || !customMessage) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el título y mensaje",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('system_notifications')
        .insert({
          type: 'general',
          title: customTitle,
          message: customMessage,
          priority: parseInt(priority),
          notification_category: 'general',
          recipient_id: user.id,
          sender_id: user.id,
          metadata: {
            test: true,
            sent_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast({
        title: "Notificación creada",
        description: "Se ha creado la notificación personalizada"
      });

      // Reset form
      setCustomTitle('');
      setCustomMessage('');
      setPriority('1');
    } catch (error) {
      console.error('Error creating custom notification:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la notificación personalizada",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkTestNotifications = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const testNotifications = [
        {
          type: 'daily_verse',
          title: 'Versículo del Día - Prueba',
          message: 'Esta es una notificación de prueba para versículos diarios',
          priority: 2,
          notification_category: 'daily_verse'
        },
        {
          type: 'agenda',
          title: 'Recordatorio de Agenda',
          message: 'Tienes un evento programado para mañana',
          priority: 2,
          notification_category: 'agenda'
        },
        {
          type: 'repertory',
          title: 'Nueva Canción Añadida',
          message: 'Se ha añadido una nueva canción al repertorio',
          priority: 1,
          notification_category: 'repertory'
        },
        {
          type: 'director_replacement',
          title: 'Solicitud de Reemplazo',
          message: 'Necesitas un director de reemplazo para el próximo servicio',
          priority: 3,
          notification_category: 'director_replacement'
        }
      ];

      const notificationsWithUser = testNotifications.map(notification => ({
        ...notification,
        recipient_id: user.id,
        sender_id: user.id,
        metadata: {
          test: true,
          bulk_test: true,
          sent_at: new Date().toISOString()
        }
      }));

      const { error } = await supabase
        .from('system_notifications')
        .insert(notificationsWithUser);

      if (error) throw error;

      toast({
        title: "Notificaciones de prueba enviadas",
        description: `Se han creado ${testNotifications.length} notificaciones de prueba`
      });
    } catch (error) {
      console.error('Error creating bulk test notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las notificaciones de prueba",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-arcana-blue-600" />
          Módulo de Prueba de Notificaciones
        </CardTitle>
        <p className="text-sm text-gray-600">
          Herramientas para probar diferentes tipos de notificaciones
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Versículo Diario</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Prueba la notificación del versículo del día usando la función edge.
              </p>
              <Button 
                onClick={sendDailyVerseNotification}
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Enviando...' : 'Probar Versículo'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Pruebas Múltiples</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Crea varias notificaciones de prueba de diferentes tipos.
              </p>
              <Button 
                onClick={sendBulkTestNotifications}
                disabled={isLoading}
                className="w-full"
                size="sm"
                variant="secondary"
              >
                <Bell className="w-4 h-4 mr-2" />
                {isLoading ? 'Creando...' : 'Crear Múltiples'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Custom Notification Form */}
        <Card className="border border-gray-200">
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Notificación Personalizada
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <Input
                placeholder="Título de la notificación"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mensaje</label>
              <Textarea
                placeholder="Contenido de la notificación"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prioridad</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-600 border-blue-600">Baja</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">Media</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-red-600 border-red-600">Alta</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={sendCustomNotification}
              disabled={isLoading || !customTitle || !customMessage}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar Notificación'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-900 mb-2">Instrucciones</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Las notificaciones aparecerán en el Centro de Notificaciones</li>
              <li>• Las notificaciones en tiempo real se mostrarán automáticamente</li>
              <li>• Puedes filtrar por tipo en el centro de notificaciones</li>
              <li>• Las notificaciones de versículos usan la función edge de Supabase</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default NotificationTestButton;