
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgendaForm } from "@/components/agenda/AgendaForm";
import { AgendaTable } from "@/components/agenda/AgendaTable";
import { CSVUpload } from "@/components/agenda/CSVUpload";
import GenerateNextYearServices from '@/components/agenda/GenerateNextYearServices';
import { Calendar, Upload, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const MinisterialAgenda = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold arcana-gradient-text truncate">Agenda Ministerial</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">Gestión de servicios y actividades del ministerio</p>
          </div>
        </div>
        <GenerateNextYearServices />
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="view" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Ver Agenda</span>
            <span className="sm:hidden">Ver</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Agregar Servicio</span>
            <span className="sm:hidden">Agregar</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Cargar CSV</span>
            <span className="sm:hidden">CSV</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Agenda de Servicios</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Vista completa de todos los servicios programados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <AgendaTable key={refreshTrigger} initialFilter={filterParam} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Agregar Nuevo Servicio</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete el formulario para programar un nuevo servicio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <AgendaForm onSuccess={handleDataUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Cargar Servicios desde CSV</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Suba un archivo CSV con los servicios para el año completo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <CSVUpload onSuccess={handleDataUpdate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinisterialAgenda;
