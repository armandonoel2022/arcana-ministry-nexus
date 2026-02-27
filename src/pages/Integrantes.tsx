import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search, Upload, Database, UserPlus, UserMinus } from "lucide-react";
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
    <div className="w-full min-h-screen bg-white fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-4 max-w-none sm:max-w-7xl sm:mx-auto sm:px-6 py-4">
        {/* Header Section */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Integrantes del Ministerio</h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Gestión de miembros y roles del ministerio
            </p>
          </div>
        </div>

        {/* Panel de Contenido Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full border border-gray-200">
          <Tabs defaultValue="view" className="w-full">
            {/* Tabs Responsivos - mismo estilo que Agenda */}
            <TabsList className={`flex w-full flex-wrap bg-gray-100/80 backdrop-blur-md border border-gray-200 rounded-xl p-1 h-auto gap-1 mb-4 sm:mb-6`}>
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

            {/* Contenido de los Tabs */}
            <TabsContent value="view" className="space-y-4 mt-4 w-full">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl p-4 sm:p-6 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-blue-900 text-lg sm:text-xl">Directorio de Integrantes</CardTitle>
                      <CardDescription className="text-blue-700 text-sm">
                        Explora y gestiona la información de todos los miembros
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <MembersList key={refreshTrigger} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add" className="space-y-4 mt-4 w-full">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl p-4 sm:p-6 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-green-900 text-lg sm:text-xl">Agregar Nuevo Integrante</CardTitle>
                      <CardDescription className="text-green-700 text-sm">
                        Completa la información del nuevo miembro
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <AddMemberForm onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-4 w-full">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-xl p-4 sm:p-6 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Database className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-purple-900 text-lg sm:text-xl">Inserción Masiva</CardTitle>
                      <CardDescription className="text-purple-700 text-sm">
                        Agrega múltiples integrantes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <BulkMemberInsert onSuccess={handleDataUpdate} />
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
                      <CardTitle className="text-orange-900 text-lg sm:text-xl">Carga Masiva desde CSV</CardTitle>
                      <CardDescription className="text-orange-700 text-sm">
                        Importa integrantes desde un archivo CSV
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full">
                  <MembersCSVUpload onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="leaves" className="space-y-4 mt-4 w-full">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-t-xl p-4 sm:p-6 border-b border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserMinus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-amber-900 text-lg sm:text-xl">Licencias</CardTitle>
                        <CardDescription className="text-amber-700 text-sm">
                          Gestión de permisos y licencias de los miembros
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 w-full">
                    <MemberLeavesTab />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Integrantes;
