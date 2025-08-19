
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search, Upload, Database, UserPlus, FileText, Download, Settings } from "lucide-react";
import MembersList from '@/components/members/MembersList';
import AddMemberForm from '@/components/members/AddMemberForm';
import MembersCSVUpload from '@/components/members/MembersCSVUpload';
import BulkMemberInsert from '@/components/members/BulkMemberInsert';

const Integrantes = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-modern-gradient">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="modern-glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-modern-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Integrantes del Ministerio</h1>
              <p className="text-white/90 text-lg drop-shadow-md">Gestión de miembros y roles del ministerio</p>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/20 backdrop-blur-md border-0 rounded-2xl p-1">
            <TabsTrigger 
              value="view" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white"
            >
              <Search className="w-4 h-4" />
              Ver Integrantes
            </TabsTrigger>
            <TabsTrigger 
              value="add" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white"
            >
              <Plus className="w-4 h-4" />
              Agregar Integrante
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white"
            >
              <Database className="w-4 h-4" />
              Lista Completa
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white"
            >
              <Upload className="w-4 h-4" />
              Cargar Masivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4 mt-6">
            <Card className="modern-card modern-shadow">
              <CardHeader className="bg-modern-gradient-soft rounded-t-2xl">
                <CardTitle className="text-modern-blue-900">Directorio de Integrantes</CardTitle>
                <CardDescription className="text-modern-blue-700">
                  Explora y gestiona la información de todos los miembros del ministerio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <MembersList key={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-6">
            <div className="modern-card p-6">
              <AddMemberForm onSuccess={handleDataUpdate} />
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-6">
            <div className="modern-card p-6">
              <BulkMemberInsert onSuccess={handleDataUpdate} />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-6">
            <div className="modern-card p-6">
              <MembersCSVUpload onSuccess={handleDataUpdate} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Integrantes;
