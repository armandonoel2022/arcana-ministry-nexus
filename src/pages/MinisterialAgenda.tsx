import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgendaForm } from "@/components/agenda/AgendaForm";
import { AgendaTable } from "@/components/agenda/AgendaTable";
import { CSVUpload } from "@/components/agenda/CSVUpload";
import GenerateNextYearServices from "@/components/agenda/GenerateNextYearServices";
import { Calendar, Upload, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const MinisterialAgenda = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");

  const handleDataUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--gradient-primary)", width: "100vw", maxWidth: "100vw" }}
    >
      <div className="w-full max-w-7xl">
        {/* Header Section con identidad ARCANA */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">Agenda Ministerial</h1>
            <p className="text-xs sm:text-sm text-white/80 truncate">
              Gestión de servicios y actividades del ministerio
            </p>
          </div>
          <GenerateNextYearServices onDataUpdate={handleDataUpdate} />
        </div>

        {/* Panel de Contenido Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full">
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

      <style>{`
        /* Responsive Design - Mismo patrón que index */
        @media screen and (max-width: 768px) {
          body, html {
            overflow-x: hidden;
          }

          .min-h-screen {
            padding: 16px;
            align-items: flex-start;
          }

          .bg-white {
            border-radius: 16px;
            padding: 16px;
            width: 100%;
          }

          .p-4\\ sm\\:p-6 {
            padding: 16px;
          }

          .p-6 {
            padding: 16px;
          }

          .gap-3 {
            gap: 12px;
          }

          .text-lg {
            font-size: 16px;
          }

          .text-xl {
            font-size: 18px;
          }
        }

        @media screen and (max-width: 480px) {
          .min-h-screen {
            padding: 12px;
          }

          .bg-white {
            border-radius: 12px;
            padding: 12px;
          }

          .p-4\\ sm\\:p-6 {
            padding: 12px;
          }

          .gap-3 {
            gap: 8px;
          }

          .text-lg {
            font-size: 14px;
          }

          .text-xl {
            font-size: 16px;
          }

          .w-8 {
            width: 24px;
            height: 24px;
          }

          .w-4 {
            width: 12px;
            height: 12px;
          }
        }

        @media screen and (max-width: 360px) {
          .min-h-screen {
            padding: 8px;
          }

          .bg-white {
            border-radius: 8px;
            padding: 8px;
          }

          .p-4\\ sm\\:p-6 {
            padding: 8px;
          }

          .text-lg {
            font-size: 13px;
          }

          .text-xl {
            font-size: 15px;
          }
        }

        .w-full {
          width: 100% !important;
          max-width: 100% !important;
        }

        .overflow-hidden {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default MinisterialAgenda;
