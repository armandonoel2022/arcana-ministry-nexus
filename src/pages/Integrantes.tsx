
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search, Upload } from "lucide-react";
import MembersList from '@/components/members/MembersList';
import AddMemberForm from '@/components/members/AddMemberForm';
import MembersCSVUpload from '@/components/members/MembersCSVUpload';

const Integrantes = () => {
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
          <h1 className="text-3xl font-bold arcana-gradient-text">Integrantes del Ministerio</h1>
          <p className="text-gray-600">Gestión de miembros y roles del ministerio</p>
        </div>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Ver Integrantes
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Integrante
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Cargar Masivo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Directorio de Integrantes</CardTitle>
              <CardDescription>
                Explora y gestiona la información de todos los miembros del ministerio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembersList key={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <AddMemberForm onSuccess={handleDataUpdate} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <MembersCSVUpload onSuccess={handleDataUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrantes;
