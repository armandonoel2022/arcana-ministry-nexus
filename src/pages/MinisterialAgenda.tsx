
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold arcana-gradient-text">Agenda Ministerial</h1>
            <p className="text-gray-600">Gestión de servicios y actividades del ministerio</p>
          </div>
        </div>
        <GenerateNextYearServices />
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ver Agenda
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Servicio
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Cargar CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Servicios</CardTitle>
              <CardDescription>
                Vista completa de todos los servicios programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgendaTable key={refreshTrigger} initialFilter={filterParam} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Servicio</CardTitle>
              <CardDescription>
                Complete el formulario para programar un nuevo servicio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgendaForm onSuccess={handleDataUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cargar Servicios desde CSV</CardTitle>
              <CardDescription>
                Suba un archivo CSV con los servicios para el año completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUpload onSuccess={handleDataUpdate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinisterialAgenda;
