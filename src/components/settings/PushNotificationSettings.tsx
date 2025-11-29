import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export const PushNotificationSettings = () => {
  const { isSupported, permission, isRegistering, requestPermission, unsubscribe } = usePushNotifications();
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      toast.success('¡Notificaciones activadas!', {
        description: 'Ahora recibirás notificaciones en tu dispositivo'
      });
    } else {
      toast.error('No se pudo activar las notificaciones', {
        description: 'Por favor, verifica los permisos en tu navegador'
      });
    }
  };

  const handleDisableNotifications = async () => {
    setIsUnsubscribing(true);
    const success = await unsubscribe();
    setIsUnsubscribing(false);
    
    if (success) {
      toast.success('Notificaciones desactivadas');
    } else {
      toast.error('No se pudo desactivar las notificaciones');
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Las notificaciones push no están disponibles en este navegador o dispositivo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificaciones Push
        </CardTitle>
        <CardDescription>
          Recibe notificaciones de cumpleaños, servicios, versículos y más directamente en tu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">Estado actual</p>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' && '✅ Activadas'}
              {permission === 'denied' && '❌ Bloqueadas'}
              {permission === 'default' && '⚪ No configuradas'}
            </p>
          </div>
          
          {permission === 'granted' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisableNotifications}
              disabled={isUnsubscribing}
            >
              <BellOff className="w-4 h-4 mr-2" />
              {isUnsubscribing ? 'Desactivando...' : 'Desactivar'}
            </Button>
          ) : permission === 'default' ? (
            <Button
              onClick={handleEnableNotifications}
              disabled={isRegistering}
              size="sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isRegistering ? 'Activando...' : 'Activar'}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Por favor, permite las notificaciones en la configuración de tu navegador
            </div>
          )}
        </div>

        {permission === 'granted' && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ¿Cómo funcionan las notificaciones?
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Llegarán directamente a tu dispositivo</li>
              <li>Aparecerán aunque la app esté cerrada</li>
              <li>Incluyen el logo de ARCANA</li>
              <li>Al tocarlas, te llevan directamente a la información</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
