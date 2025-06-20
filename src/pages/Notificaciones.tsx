
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BookOpen, Settings, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'verse' | 'recommendation';
  title: string;
  content: string;
  created_at: string;
}

const Notificaciones = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Simulando notificaciones por ahora - se conectará a la base de datos después
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'verse',
          title: 'Versículo del día',
          content: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. - Juan 3:16',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Recomendación del día',
          content: 'Ejercicio de Respiración Diafragmática: Acuéstate boca arriba, coloca un libro sobre tu abdomen y respira profundamente...',
          created_at: new Date().toISOString()
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verse':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'recommendation':
        return <Settings className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'verse':
        return 'border-l-blue-500 bg-blue-50';
      case 'recommendation':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold arcana-gradient-text">Notificaciones</h1>
            <p className="text-gray-600">Historial de notificaciones diarias</p>
          </div>
        </div>
        <div className="text-center">Cargando notificaciones...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold arcana-gradient-text">Notificaciones</h1>
          <p className="text-gray-600">Historial de notificaciones diarias</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`border-l-4 ${getNotificationColor(notification.type)} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {getNotificationIcon(notification.type)}
                <div>
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(notification.created_at)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {notification.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No hay notificaciones
          </h3>
          <p className="text-gray-500">
            Las notificaciones diarias aparecerán aquí
          </p>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
