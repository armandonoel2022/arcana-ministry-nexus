import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { sendiOSPushNotification, sendPushToToken } from '@/utils/pushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Send, Smartphone, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DeviceInfo {
  id: string;
  device_token: string;
  platform: string;
  user_id: string | null;
  is_active: boolean;
  last_active: string;
  user_name?: string;
}

export const PushTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [title, setTitle] = useState('🔔 Notificación de Prueba');
  const [body, setBody] = useState('Esta es una notificación de prueba desde el panel de administración');
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('is_active', true)
        .order('last_active', { ascending: false });

      if (error) throw error;

      // Obtener nombres de usuarios
      if (data && data.length > 0) {
        const userIds = data.filter(d => d.user_id).map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const devicesWithNames = data.map(device => ({
          ...device,
          user_name: profiles?.find(p => p.id === device.user_id)?.full_name || 'Sin usuario'
        }));

        setDevices(devicesWithNames);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Error cargando dispositivos');
    } finally {
      setLoadingDevices(false);
    }
  };

  const sendTestPushToAll = async () => {
    try {
      setLoading(true);
      setLastResult(null);
      
      toast.info('Enviando push a todos los dispositivos...');
      
      const result = await sendiOSPushNotification({
        title,
        body,
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
          source: 'admin_panel'
        },
        badge: 1
      });
      
      if (result.success) {
        const message = `✅ Push enviada a ${result.sentCount} de ${result.totalDevices} dispositivos`;
        toast.success(message);
        setLastResult({ success: true, message });
      } else {
        const message = `❌ Error: ${result.error?.message || JSON.stringify(result.error)}`;
        toast.error(message);
        setLastResult({ success: false, message });
      }
      
    } catch (error: any) {
      console.error('Error:', error);
      const message = `Error: ${error.message}`;
      toast.error(message);
      setLastResult({ success: false, message });
    } finally {
      setLoading(false);
    }
  };

  const sendTestPushToToken = async () => {
    if (!selectedToken) {
      toast.error('Selecciona un token primero');
      return;
    }

    try {
      setLoading(true);
      setLastResult(null);
      
      toast.info('Enviando push al dispositivo seleccionado...');
      
      const result = await sendPushToToken(selectedToken, {
        title,
        body,
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
          source: 'admin_panel'
        },
        badge: 1
      });
      
      if (result.success) {
        const message = '✅ Push enviada exitosamente';
        toast.success(message);
        setLastResult({ success: true, message });
      } else {
        const message = `❌ Error: ${result.error?.message || JSON.stringify(result.error)}`;
        toast.error(message);
        setLastResult({ success: false, message });
      }
      
    } catch (error: any) {
      console.error('Error:', error);
      const message = `Error: ${error.message}`;
      toast.error(message);
      setLastResult({ success: false, message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Test Push Notifications iOS
          </CardTitle>
          <CardDescription>
            Envía push notifications de prueba a dispositivos iOS registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la notificación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensaje</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contenido de la notificación"
              rows={3}
            />
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={sendTestPushToAll} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar a Todos ({devices.length})
            </Button>
          </div>

          {lastResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              lastResult.success 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{lastResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Dispositivos Registrados
              </CardTitle>
              <CardDescription>
                Lista de dispositivos iOS con push notifications activas
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDevices}
              disabled={loadingDevices}
            >
              <RefreshCw className={`h-4 w-4 ${loadingDevices ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay dispositivos iOS registrados</p>
              <p className="text-sm mt-1">
                Los dispositivos aparecerán aquí cuando acepten push notifications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div 
                  key={device.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedToken === device.device_token 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedToken(device.device_token)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{device.user_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {device.device_token.substring(0, 20)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={device.is_active ? "default" : "secondary"}>
                        {device.platform}
                      </Badge>
                      {selectedToken === device.device_token && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Última actividad: {new Date(device.last_active).toLocaleString('es-ES')}
                  </p>
                </div>
              ))}

              {selectedToken && (
                <Button 
                  onClick={sendTestPushToToken} 
                  disabled={loading}
                  className="w-full mt-4"
                  variant="outline"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Solo al Seleccionado
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PushTestPanel;
