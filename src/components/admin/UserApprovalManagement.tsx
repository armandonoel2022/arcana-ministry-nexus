import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserCheck, UserX, Key, Clock } from 'lucide-react';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_approved: boolean;
  needs_password_change: boolean;
}

interface PasswordResetRequest {
  id: string;
  user_email: string;
  created_at: string;
  status: string;
}

const UserApprovalManagement = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisionalPasswords, setProvisionalPasswords] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchPendingUsers();
    fetchPasswordResetRequests();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error: any) {
      toast.error('Error al cargar usuarios pendientes: ' + error.message);
    }
  };

  const fetchPasswordResetRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPasswordResetRequests(data || []);
    } catch (error: any) {
      toast.error('Error al cargar solicitudes de restablecimiento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateProvisionalPassword = () => {
    return 'Arcana2026';
  };

  const approveUser = async (userId: string, userEmail: string) => {
    try {
      const provisionalPassword = generateProvisionalPassword();
      
      // Update user profile to approved
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          needs_password_change: true,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update provisional password in local state for display
      setProvisionalPasswords(prev => ({ ...prev, [userId]: provisionalPassword }));

      // Send notification to user
      await supabase
        .from('system_notifications')
        .insert([
          {
            type: 'user_approved',
            title: 'Cuenta Aprobada',
            message: `Tu cuenta ha sido aprobada. Tu contraseña provisional es: ${provisionalPassword}. Debes cambiarla en tu primer inicio de sesión.`,
            recipient_id: userId,
            notification_category: 'account'
          }
        ]);

      toast.success(`Usuario aprobado. Contraseña provisional: ${provisionalPassword}`);
      fetchPendingUsers();
    } catch (error: any) {
      toast.error('Error al aprobar usuario: ' + error.message);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      toast.success('Usuario rechazado y eliminado');
      fetchPendingUsers();
    } catch (error: any) {
      toast.error('Error al rechazar usuario: ' + error.message);
    }
  };

  const handlePasswordResetRequest = async (requestId: string, userEmail: string) => {
    try {
      const provisionalPassword = generateProvisionalPassword();

      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile) {
        toast.error('No se encontró un usuario con ese correo electrónico');
        return;
      }

      // Call Edge Function to actually reset the password
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        'https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/admin-reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            userId: profile.id,
            newPassword: provisionalPassword,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al restablecer contraseña');
      }

      // Update user to need password change
      await supabase
        .from('profiles')
        .update({ needs_password_change: true })
        .eq('id', profile.id);

      // Mark request as completed
      await supabase
        .from('password_reset_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      // Send notification to user
      await supabase
        .from('system_notifications')
        .insert([
          {
            type: 'password_reset',
            title: 'Contraseña Restablecida',
            message: `Tu contraseña ha sido restablecida a: ${provisionalPassword}. Debes cambiarla en tu próximo inicio de sesión.`,
            recipient_id: profile.id,
            notification_category: 'account'
          }
        ]);

      toast.success(`Contraseña restablecida exitosamente: ${provisionalPassword}`);
      fetchPasswordResetRequests();
    } catch (error: any) {
      toast.error('Error al procesar solicitud: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Usuarios Pendientes de Aprobación
          </CardTitle>
          <CardDescription>
            Usuarios que han solicitado registro y esperan aprobación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay usuarios pendientes de aprobación
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitud: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    {provisionalPasswords[user.id] && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <strong>Contraseña provisional:</strong> {provisionalPasswords[user.id]}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveUser(user.id, user.email)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => rejectUser(user.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Reset Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Solicitudes de Restablecimiento de Contraseña
          </CardTitle>
          <CardDescription>
            Usuarios que han solicitado restablecer su contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordResetRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay solicitudes de restablecimiento pendientes
            </p>
          ) : (
            <div className="space-y-4">
              {passwordResetRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{request.user_email}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {request.status}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handlePasswordResetRequest(request.id, request.user_email)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Generar Contraseña
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserApprovalManagement;