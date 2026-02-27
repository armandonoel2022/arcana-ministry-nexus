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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="w-full px-3 py-3 md:px-4 md:py-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">Integrantes del Ministerio</h1>
            <p className="text-xs md:text-sm text-white/90">Gestión de miembros y roles del ministerio</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-xl overflow-x-auto">
          <Tabs defaultValue="view" className="w-full">
            {/* Tabs Navigation - Sin padding adicional */}
            <div className="border-b border-gray-200">
              <TabsList className="w-full h-auto p-0 bg-transparent flex overflow-x-auto">
                <TabsTrigger
                  value="view"
                  className="flex-1 min-w-[70px] px-2 py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent text-gray-600 text-xs md:text-sm"
                >
                  <Search className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" />
                  <span className="block mt-0.5">Ver</span>
                </TabsTrigger>
                <TabsTrigger
                  value="add"
                  className="flex-1 min-w-[70px] px-2 py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent text-gray-600 text-xs md:text-sm"
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" />
                  <span className="block mt-0.5">Agregar</span>
                </TabsTrigger>
                <TabsTrigger
                  value="bulk"
                  className="flex-1 min-w-[70px] px-2 py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent text-gray-600 text-xs md:text-sm"
                >
                  <Database className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" />
                  <span className="block mt-0.5">Lista</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex-1 min-w-[70px] px-2 py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent text-gray-600 text-xs md:text-sm"
                >
                  <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" />
                  <span className="block mt-0.5">CSV</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="leaves"
                    className="flex-1 min-w-[70px] px-2 py-3 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-600 rounded-none bg-transparent text-gray-600 text-xs md:text-sm"
                  >
                    <UserMinus className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto" />
                    <span className="block mt-0.5">Licencias</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab Content - SIN PADDING EXTRA */}
            <div className="p-0">
              <TabsContent value="view" className="mt-0">
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-gray-900">Directorio de Integrantes</h2>
                      <p className="text-xs md:text-sm text-gray-600">
                        Explora y gestiona la información de todos los miembros
                      </p>
                    </div>
                  </div>
                  <MembersList key={refreshTrigger} />
                </div>
              </TabsContent>

              <TabsContent value="add" className="mt-0">
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-gray-900">Agregar Nuevo Integrante</h2>
                      <p className="text-xs md:text-sm text-gray-600">Completa la información del nuevo miembro</p>
                    </div>
                  </div>
                  <AddMemberForm onSuccess={handleDataUpdate} />
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="mt-0">
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Database className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-gray-900">Inserción Masiva</h2>
                      <p className="text-xs md:text-sm text-gray-600">Agrega múltiples integrantes</p>
                    </div>
                  </div>
                  <BulkMemberInsert onSuccess={handleDataUpdate} />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Upload className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-gray-900">Carga Masiva desde CSV</h2>
                      <p className="text-xs md:text-sm text-gray-600">Importa integrantes desde un archivo CSV</p>
                    </div>
                  </div>
                  <MembersCSVUpload onSuccess={handleDataUpdate} />
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="leaves" className="mt-0">
                  <div className="p-4 md:p-6">
                    <MemberLeavesTab />
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>

    </div>
  );
};

export default Integrantes;
