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
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
              Integrantes del Ministerio
            </h1>
            <p className="text-xs sm:text-sm text-white/90 truncate">Gestión de miembros y roles del ministerio</p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <Tabs defaultValue="view" className="w-full">
            {/* Tabs Navigation - Fixed at top */}
            <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6">
              <TabsList className="h-auto p-0 bg-transparent border-0 gap-2 w-full flex flex-nowrap overflow-x-auto scrollbar-hide">
                <TabsTrigger
                  value="view"
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Ver</span>
                </TabsTrigger>
                <TabsTrigger
                  value="add"
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Agregar</span>
                </TabsTrigger>
                <TabsTrigger
                  value="bulk"
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                >
                  <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Lista</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>CSV</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="leaves"
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-600 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                  >
                    <UserMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Licencias</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              <TabsContent value="view" className="mt-0 w-full">
                <Card className="border-0 shadow-none p-0">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-blue-900 text-lg sm:text-xl">Directorio de Integrantes</CardTitle>
                        <CardDescription className="text-blue-700/70 text-sm">
                          Explora y gestiona la información de todos los miembros del ministerio
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="w-full overflow-x-auto">
                      <MembersList key={refreshTrigger} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="add" className="mt-0 w-full">
                <Card className="border-0 shadow-none p-0">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-green-900 text-lg sm:text-xl">Agregar Nuevo Integrante</CardTitle>
                        <CardDescription className="text-green-700/70 text-sm">
                          Añade un nuevo miembro al ministerio completando la información requerida
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <AddMemberForm onSuccess={handleDataUpdate} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk" className="mt-0 w-full">
                <Card className="border-0 shadow-none p-0">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-purple-900 text-lg sm:text-xl">Inserción Masiva</CardTitle>
                        <CardDescription className="text-purple-700/70 text-sm">
                          Agrega múltiples integrantes utilizando datos estructurados
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <BulkMemberInsert onSuccess={handleDataUpdate} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload" className="mt-0 w-full">
                <Card className="border-0 shadow-none p-0">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-orange-900 text-lg sm:text-xl">Carga Masiva desde CSV</CardTitle>
                        <CardDescription className="text-orange-700/70 text-sm">
                          Importa integrantes desde un archivo CSV con el formato correcto
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <MembersCSVUpload onSuccess={handleDataUpdate} />
                  </CardContent>
                </Card>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="leaves" className="mt-0 w-full">
                  <MemberLeavesTab />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        /* Ensure all content respects container width */
        .container {
          width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        /* Fix for potential overflow in child components */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};

export default Integrantes;
