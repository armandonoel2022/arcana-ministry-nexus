import React from 'react';
import { Bell } from "lucide-react";
import NotificationTestButton from '@/components/notifications/NotificationTestButton';

const NotificationTesting = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Bell className="w-8 h-8 text-arcana-blue-600" />
          Pruebas de Notificaciones
        </h1>
        <p className="text-gray-600">
          Prueba diferentes tipos de notificaciones superpuestas del sistema ARCANA
        </p>
      </div>
      
      <NotificationTestButton />
    </div>
  );
};

export default NotificationTesting;