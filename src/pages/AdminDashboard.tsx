
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { ChatRoomManagement } from "@/components/admin/ChatRoomManagement";
import { Users, MessageSquare, Shield, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Acceso Denegado",
          description: "Debes estar autenticado para acceder",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['administrator', 'admin'].includes(profile.role)) {
        toast({
          title: "Acceso Denegado",
          description: "Solo los administradores pueden acceder a esta sección",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Error al verificar permisos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Verificando permisos...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Shield className="w-20 h-20 mx-auto text-gray-400 mb-6" />
          <h1 className="text-3xl font-bold text-gray-600 mb-4">Acceso Restringido</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Esta sección está reservada para administradores del sistema. 
            Si crees que deberías tener acceso, contacta al administrador principal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-arcana-blue-600" />
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona usuarios, roles y salas de chat del sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Gestión de Usuarios
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Gestión de Salas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-arcana-blue-600" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-arcana-gold-600" />
                Gestión de Salas de Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatRoomManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
