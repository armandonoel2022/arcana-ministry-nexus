
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserCheck, MessageSquare, History, Eye } from "lucide-react";
import DirectorRequestResponse from '@/components/agenda/DirectorRequestResponse';
import DirectorReplacementHistory from '@/components/agenda/DirectorReplacementHistory';

const DirectorReplacements = () => {
  const handlePreviewRequest = () => {
    // Simulate a request notification
    const mockRequest = {
      id: 'test-request-1',
      service_id: 'test-service-1',
      original_director_id: 'test-user-1',
      reason: 'Tengo un compromiso familiar importante ese día y no podré asistir al servicio.',
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      original_director: {
        full_name: 'Roosevelt Martínez',
        phone: '809-555-1234',
        email: 'roosevelt@example.com',
        photo_url: undefined
      },
      services: {
        title: 'Culto Dominical',
        service_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Templo Principal'
      }
    };

    window.dispatchEvent(new CustomEvent('testDirectorRequestOverlay', { detail: mockRequest }));
  };

  const handlePreviewNotification = () => {
    // Simulate a director change notification with Roosevelt's photo
    const mockNotification = {
      id: 'test-notification-' + Date.now(),
      metadata: {
        service_id: 'test-service-1',
        service_title: '10:45 a.m.',
        service_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        new_director: 'Roosevelt Martínez',
        new_director_photo: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/60b1f3d9-9826-4e5c-a348-cebbdbd2a7c9.JPG',
        original_director: 'Armando Noel',
        original_director_photo: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG'
      }
    };

    // Clear all dismissed notifications to allow testing
    localStorage.removeItem('dismissedDirectorChanges');

    window.dispatchEvent(new CustomEvent('testDirectorChangeNotification', { detail: mockNotification }));
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold arcana-gradient-text truncate">Reemplazos de Director</h1>
          <p className="text-xs sm:text-sm text-gray-600 truncate">Gestión de solicitudes de reemplazo entre directores</p>
        </div>
      </div>

      {/* Preview Buttons */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            Vista Previa de Overlays
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Prueba los overlays de solicitud y notificación
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            onClick={handlePreviewRequest}
            variant="outline"
            className="flex-1 border-blue-300 hover:bg-blue-50 text-xs sm:text-sm"
            size="sm"
          >
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="truncate">Preview: Solicitud Recibida</span>
          </Button>
          <Button 
            onClick={handlePreviewNotification}
            variant="outline"
            className="flex-1 border-green-300 hover:bg-green-50 text-xs sm:text-sm"
            size="sm"
          >
            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="truncate">Preview: Notificación de Cambio</span>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Solicitudes Pendientes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <DirectorRequestResponse />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <DirectorReplacementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DirectorReplacements;
