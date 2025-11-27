import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search, Upload, Database, UserPlus, FileText, Download, Settings } from "lucide-react";
import MembersList from "@/components/members/MembersList";
import AddMemberForm from "@/components/members/AddMemberForm";
import MembersCSVUpload from "@/components/members/MembersCSVUpload";
import BulkMemberInsert from "@/components/members/BulkMemberInsert";

const Integrantes = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
              Integrantes del Ministerio
            </h1>
            <p className="text-xs sm:text-sm text-white/80 truncate">Gestión de miembros y roles del ministerio</p>
          </div>
        </div>

        {/* Panel de Contenido Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <Tabs defaultValue="view" className="w-full">
            {/* Tabs Responsivos */}
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gray-100/80 backdrop-blur-md border border-gray-200 rounded-xl p-1 h-auto gap-1 mb-4 sm:mb-6">
              <TabsTrigger
                value="view"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200"
              >
                <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Ver Integrantes</span>
                <span className="sm:hidden">Ver</span>
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Agregar</span>
                <span className="sm:hidden">Agregar</span>
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200"
              >
                <Database className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Lista Completa</span>
                <span className="sm:hidden">Lista</span>
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Cargar CSV</span>
                <span className="sm:hidden">CSV</span>
              </TabsTrigger>
            </TabsList>

            {/* Contenido de los Tabs */}
            <TabsContent value="view" className="space-y-4 mt-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl p-4 sm:p-6 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-900 text-lg sm:text-xl">Directorio de Integrantes</CardTitle>
                      <CardDescription className="text-blue-700 text-xs sm:text-sm">
                        Explora y gestiona la información de todos los miembros del ministerio
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <MembersList key={refreshTrigger} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add" className="space-y-4 mt-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl p-4 sm:p-6 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-green-900 text-lg sm:text-xl">Agregar Nuevo Integrante</CardTitle>
                      <CardDescription className="text-green-700 text-xs sm:text-sm">
                        Añade un nuevo miembro al ministerio completando la información requerida
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <AddMemberForm onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-xl p-4 sm:p-6 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Database className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-purple-900 text-lg sm:text-xl">Inserción Masiva</CardTitle>
                      <CardDescription className="text-purple-700 text-xs sm:text-sm">
                        Agrega múltiples integrantes utilizando datos estructurados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <BulkMemberInsert onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-xl p-4 sm:p-6 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900 text-lg sm:text-xl">Carga Masiva desde CSV</CardTitle>
                      <CardDescription className="text-orange-700 text-xs sm:text-sm">
                        Importa integrantes desde un archivo CSV con el formato correcto
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <MembersCSVUpload onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <style>{`
        @media screen and (max-width: 640px) {
          .min-h-screen {
            padding: 12px 8px;
          }
          
          .bg-white {
            border-radius: 16px;
          }
        }

        @media screen and (max-width: 480px) {
          .min-h-screen {
            padding: 8px 4px;
          }
          
          .bg-white {
            border-radius: 12px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Integrantes;
