
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  joined_date: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'administrator') {
        toast({
          title: "Acceso Denegado",
          description: "Solo los administradores pueden acceder a esta función",
          variant: "destructive"
        });
        return;
      }
      setCurrentUser(user);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Rol de usuario actualizado correctamente"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive"
      });
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      'administrator': { label: 'Administrador', color: 'bg-red-500' },
      'admin': { label: 'Admin', color: 'bg-purple-500' },
      'leader': { label: 'Líder', color: 'bg-blue-500' },
      'musician': { label: 'Músico', color: 'bg-green-500' },
      'vocalist': { label: 'Vocal', color: 'bg-yellow-500' },
      'member': { label: 'Miembro', color: 'bg-gray-500' }
    };
    
    return roleMap[role] || { label: role, color: 'bg-gray-500' };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando usuarios...</div>;
  }

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">Acceso Restringido</h3>
        <p className="text-gray-500">Solo los administradores pueden acceder a esta función</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-arcana-blue-600" />
        <p className="text-gray-600">Administra los roles y permisos de los usuarios</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const roleInfo = getRoleDisplay(user.role);
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-arcana-blue-100">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      <p className="text-gray-600 text-sm">{user.email}</p>
                      <p className="text-gray-500 text-xs">
                        Miembro desde: {new Date(user.joined_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`${roleInfo.color} text-white`}>
                        {roleInfo.label}
                      </Badge>
                      
                      {user.is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <UserX className="w-3 h-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Miembro</SelectItem>
                          <SelectItem value="vocalist">Vocal</SelectItem>
                          <SelectItem value="musician">Músico</SelectItem>
                          <SelectItem value="leader">Líder</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="administrator">Administrador</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant={user.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        disabled={user.id === currentUser?.id}
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
