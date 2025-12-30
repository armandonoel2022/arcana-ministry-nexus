import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgendaForm } from "@/components/agenda/AgendaForm";
import { AgendaTable } from "@/components/agenda/AgendaTable";
import { CSVUpload } from "@/components/agenda/CSVUpload";
import GenerateNextYearServices from "@/components/agenda/GenerateNextYearServices";
import MonthlyAgendaPDF from "@/components/agenda/MonthlyAgendaPDF";
import { Calendar, Upload, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const MinisterialAgenda = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Cargar años disponibles para el PDF
  useEffect(() => {
    const loadYears = async () => {
      const { data } = await supabase
        .from("services")
        .select("service_date")
        .order("service_date", { ascending: true });
      
      if (data) {
        const years = [...new Set(data.map((s) => new Date(s.service_date).getFullYear()))].sort((a, b) => a - b);
        setAvailableYears(years);
      }
    };
    loadYears();
  }, [refreshTrigger]);

  const handleDataUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full min-h-screen bg-white fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-4 max-w-none sm:max-w-7xl sm:mx-auto sm:px-6 py-4">
        {/* Header Section con identidad ARCANA */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Agenda Ministerial</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Gestión de servicios y actividades del ministerio
            </p>
          </div>
          <GenerateNextYearServices onDataUpdate={handleDataUpdate} />
        </div>

        {/* Componente de descarga de PDF mensual */}
        <div className="mb-4">
          <MonthlyAgendaPDF availableYears={availableYears} />
        </div>

        {/* Panel de Contenido Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full border border-gray-200">
          <Tabs defaultValue="view" className="w-full">
            {/* Tabs Responsivos */}
            <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 backdrop-blur-md border border-gray-200 rounded-xl p-1 h-auto gap-1 mb-4 sm:mb-6">
              <TabsTrigger
                value="view"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Ver</span>
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Agregar</span>
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">CSV</span>
              </TabsTrigger>
            </TabsList>

            {/* Contenido de los Tabs */}
            <TabsContent value="view" className="space-y-4 mt-4 w-full">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl p-4 sm:p-6 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-blue-900 text-lg sm:text-xl">Agenda de Servicios</CardTitle>
                      <CardDescription className="text-blue-700 text-sm">
                        Vista completa de todos los servicios programados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <AgendaTable key={refreshTrigger} initialFilter={filterParam} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add" className="space-y-4 mt-4 w-full">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl p-4 sm:p-6 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-green-900 text-lg sm:text-xl">Agregar Nuevo Servicio</CardTitle>
                      <CardDescription className="text-green-700 text-sm">
                        Complete el formulario para programar un nuevo servicio
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <AgendaForm onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4 w-full">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-xl p-4 sm:p-6 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-orange-900 text-lg sm:text-xl">Cargar Servicios desde CSV</CardTitle>
                      <CardDescription className="text-orange-700 text-sm">
                        Suba un archivo CSV con los servicios para el año completo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <CSVUpload onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MinisterialAgenda;
