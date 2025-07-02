import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Plus, Search, Upload } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import AddSongForm from '@/components/songs/AddSongForm';
import CSVUpload from '@/components/songs/CSVUpload';
import SongCatalog from '@/components/songs/SongCatalog';
import NotificationTestButton from '@/components/NotificationTestButton';

const RepertoirioMusical = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold arcana-gradient-text">Repertorio Musical</h1>
            <p className="text-gray-600">Gestión del catálogo de canciones del ministerio</p>
          </div>
        </div>
        
        {/* Botón de prueba de notificaciones solo para administradores */}
        {userRole === 'administrator' && (
          <NotificationTestButton />
        )}
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Ver Repertorio
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Canción
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Cargar Masivo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Canciones</CardTitle>
              <CardDescription>
                Explora y gestiona el repertorio musical del ministerio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SongCatalog />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <AddSongForm />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <CSVUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RepertoirioMusical;
