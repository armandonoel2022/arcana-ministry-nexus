
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
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="modern-glass rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-3 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-8 sm:h-8 text-modern-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-3xl md:text-4xl font-bold text-white mb-0 sm:mb-1 drop-shadow-lg truncate">Integrantes del Ministerio</h1>
              <p className="text-white/90 text-[10px] sm:text-base md:text-lg drop-shadow-md truncate hidden sm:block">Gestión de miembros y roles del ministerio</p>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/20 backdrop-blur-md border-0 rounded-xl sm:rounded-2xl p-1 h-auto gap-1 sm:gap-0">
            <TabsTrigger 
              value="view" 
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Ver Integrantes</span>
              <span className="sm:hidden">Ver</span>
            </TabsTrigger>
            <TabsTrigger 
              value="add" 
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Agregar Integrante</span>
              <span className="sm:hidden">Agregar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <Database className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Lista Completa</span>
              <span className="sm:hidden">Lista</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-white text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Cargar Masivo</span>
              <span className="sm:hidden">CSV</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-3 sm:space-y-4 mt-3 sm:mt-6">
            <Card className="modern-card modern-shadow">
              <CardHeader className="bg-modern-gradient-soft rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6">
                <CardTitle className="text-modern-blue-900 text-lg sm:text-xl">Directorio de Integrantes</CardTitle>
                <CardDescription className="text-modern-blue-700 text-xs sm:text-sm">
                  Explora y gestiona la información de todos los miembros del ministerio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <MembersList key={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-3 sm:space-y-4 mt-3 sm:mt-6">
            <div className="modern-card p-4 sm:p-6">
              <AddMemberForm onSuccess={handleDataUpdate} />
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-3 sm:space-y-4 mt-3 sm:mt-6">
            <div className="modern-card p-4 sm:p-6">
              <BulkMemberInsert onSuccess={handleDataUpdate} />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 sm:space-y-4 mt-3 sm:mt-6">
            <div className="modern-card p-4 sm:p-6">
              <MembersCSVUpload onSuccess={handleDataUpdate} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Integrantes;
