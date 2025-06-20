
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search, Settings } from "lucide-react";
import WorshipGroupsList from '@/components/groups/WorshipGroupsList';
import AddGroupForm from '@/components/groups/AddGroupForm';
import GroupMembersManagement from '@/components/groups/GroupMembersManagement';

const WorshipGroups = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold arcana-gradient-text">Grupos de Alabanza</h1>
          <p className="text-gray-600">Gestión de grupos y asignación de miembros</p>
        </div>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Ver Grupos
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Crear Grupo
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Gestionar Miembros
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grupos de Alabanza Activos</CardTitle>
              <CardDescription>
                Visualiza y gestiona todos los grupos de alabanza del ministerio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorshipGroupsList key={refreshTrigger} onUpdate={handleDataUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <AddGroupForm onSuccess={handleDataUpdate} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <GroupMembersManagement key={refreshTrigger} onUpdate={handleDataUpdate} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Grupos</CardTitle>
              <CardDescription>
                Ajustes generales para la gestión de grupos de alabanza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Configuraciones avanzadas próximamente...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorshipGroups;
