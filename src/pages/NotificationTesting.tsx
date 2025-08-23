import React from 'react';
import NotificationTestMenu from '@/components/notifications/NotificationTestMenu';

const NotificationTesting = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pruebas de Notificaciones
        </h1>
        <p className="text-gray-600">
          Prueba diferentes tipos de notificaciones superpuestas del sistema ARCANA
        </p>
      </div>
      
      <NotificationTestMenu />
    </div>
  );
};

export default NotificationTesting;