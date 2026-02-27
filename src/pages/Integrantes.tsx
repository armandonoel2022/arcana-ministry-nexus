import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search, Upload, Database, UserPlus, FileText, Download, Settings, UserMinus } from "lucide-react";
import MembersList from "@/components/members/MembersList";
import AddMemberForm from "@/components/members/AddMemberForm";
import MembersCSVUpload from "@/components/members/MembersCSVUpload";
import BulkMemberInsert from "@/components/members/BulkMemberInsert";
import MemberLeavesTab from "@/components/members/MemberLeavesTab";
import { usePermissions } from "@/hooks/usePermissions";

const Integrantes = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAdmin } = usePermissions();

  const handleDataUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: "var(--gradient-primary)" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
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
        <div className="bg-white rounded-2xl shadow-xl w-full">
          <Tabs defaultValue="view" className="w-full">
            {/* Tabs Responsivos */}
            <div className="p-4 sm:p-6 pb-0">
              <TabsList
                className={`grid w-full ${isAdmin ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"} bg-gray-100/80 backdrop-blur-md border border-gray-200 rounded-xl p-1 h-auto gap-1`}
              >
                <TabsTrigger
                  value="view"
                  className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
                >
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
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
                  value="bulk"
                  className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
                >
                  <Database className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Lista</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">CSV</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="leaves"
                    className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-lg text-gray-700 text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 flex-1 min-w-0"
                  >
                    <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Licencias</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Contenido de los Tabs */}
            <div className="p-4 sm:p-6 pt-4">
              <TabsContent value="view" className="space-y-4 w-full mt-0">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl p-4 sm:p-6 border-b border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-blue-900 text-lg sm:text-xl">Directorio de Integrantes</CardTitle>
                        <CardDescription className="text-blue-700 text-sm">
                          Explora y gestiona la información de todos los miembros del ministerio
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 w-full">
                    <MembersList key={refreshTrigger} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="add" className="space-y-4 w-full mt-0">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl p-4 sm:p-6 border-b border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-green-900 text-lg sm:text-xl">Agregar Nuevo Integrante</CardTitle>
                        <CardDescription className="text-green-700 text-sm">
                          Añade un nuevo miembro al ministerio completando la información requerida
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 w-full">
                    <AddMemberForm onSuccess={handleDataUpdate} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4 w-full mt-0">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-xl p-4 sm:p-6 border-b border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Database className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-purple-900 text-lg sm:text-xl">Inserción Masiva</CardTitle>
                        <CardDescription className="text-purple-700 text-sm">
                          Agrega múltiples integrantes utilizando datos estructurados
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 w-full">
                    <BulkMemberInsert onSuccess={handleDataUpdate} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 w-full mt-0">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-xl p-4 sm:p-6 border-b border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-orange-900 text-lg sm:text-xl">Carga Masiva desde CSV</CardTitle>
                        <CardDescription className="text-orange-700 text-sm">
                          Importa integrantes desde un archivo CSV con el formato correcto
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 w-full">
                    <MembersCSVUpload onSuccess={handleDataUpdate} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de Licencias (solo admin) */}
              {isAdmin && (
                <TabsContent value="leaves" className="space-y-4 w-full mt-0">
                  <MemberLeavesTab />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      <style>{`
        /* Asegurar que no haya desbordamiento horizontal */
        body, html {
          overflow-x: hidden;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        /* Responsive Design */
        @media screen and (max-width: 768px) {
          .px-4 {
            padding-left: 16px;
            padding-right: 16px;
          }
        }

        @media screen and (max-width: 480px) {
          .px-4 {
            padding-left: 12px;
            padding-right: 12px;
          }
        }

        @media screen and (max-width: 360px) {
          .px-4 {
            padding-left: 8px;
            padding-right: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Integrantes;
