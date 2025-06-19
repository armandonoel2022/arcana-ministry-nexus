
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Plus, Search, Upload } from "lucide-react";

const RepertoirioMusical = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold arcana-gradient-text">Repertorio Musical</h1>
          <p className="text-gray-600">Gestión del catálogo de canciones del ministerio</p>
        </div>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Ver Repertorio
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Canción
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Cargar Masivo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Canciones</CardTitle>
              <CardDescription>
                Explora y gestiona el repertorio musical del ministerio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Repertorio Musical en Construcción</p>
                <p className="text-sm">Pronto podrás ver y gestionar todas las canciones del ministerio</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nueva Canción</CardTitle>
              <CardDescription>
                Añade una nueva canción al repertorio del ministerio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Formulario de Canción en Construcción</p>
                <p className="text-sm">Pronto podrás agregar canciones individualmente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carga Masiva de Canciones</CardTitle>
              <CardDescription>
                Importa múltiples canciones desde un archivo CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Carga Masiva en Construcción</p>
                <p className="text-sm">Pronto podrás importar canciones desde CSV</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RepertoirioMusical;
