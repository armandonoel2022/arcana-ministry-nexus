import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Mic, Guitar, Monitor, ArrowLeft, RefreshCw } from "lucide-react";
import DirectorRequestResponse from '@/components/agenda/DirectorRequestResponse';
import DirectorChangeRequest from '@/components/agenda/DirectorChangeRequest';
import DirectorReplacementHistory from '@/components/agenda/DirectorReplacementHistory';
import VoiceReplacementRequest from '@/components/replacements/VoiceReplacementRequest';
import MusicianReplacementRequest from '@/components/replacements/MusicianReplacementRequest';
import MultimediaReplacementRequest from '@/components/replacements/MultimediaReplacementRequest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History } from "lucide-react";

type ReplacementMode = 'selector' | 'director' | 'voice' | 'musician' | 'multimedia';

const DirectorReplacements = () => {
  const [mode, setMode] = useState<ReplacementMode>('selector');

  const renderModeSelector = () => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-arcana-gradient rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4 arcana-gradient-text">Reemplazos</h1>
        <p className="text-muted-foreground text-sm sm:text-lg">Selecciona el tipo de reemplazo</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl w-full">
        {/* Reemplazo de Directores */}
        <Card 
          className="cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border-2 hover:border-blue-500 hover:shadow-xl group active:scale-[0.98]"
          onClick={() => setMode('director')}
        >
          <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px]">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-blue-500/30 transition-colors">
              <UserCheck className="w-6 h-6 sm:w-10 sm:h-10 text-blue-500" />
            </div>
            <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-center">Directores</h2>
            <p className="text-muted-foreground text-center text-xs sm:text-sm">
              Directores de alabanza
            </p>
          </CardContent>
        </Card>

        {/* Reemplazo de Voces */}
        <Card 
          className="cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border-2 hover:border-purple-500 hover:shadow-xl group active:scale-[0.98]"
          onClick={() => setMode('voice')}
        >
          <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px]">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-purple-500/30 transition-colors">
              <Mic className="w-6 h-6 sm:w-10 sm:h-10 text-purple-500" />
            </div>
            <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-center">Voces</h2>
            <p className="text-muted-foreground text-center text-xs sm:text-sm">
              Coristas y coros
            </p>
          </CardContent>
        </Card>

        {/* Reemplazo de Músicos */}
        <Card 
          className="cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border-2 hover:border-orange-500 hover:shadow-xl group active:scale-[0.98]"
          onClick={() => setMode('musician')}
        >
          <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px]">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-orange-500/30 transition-colors">
              <Guitar className="w-6 h-6 sm:w-10 sm:h-10 text-orange-500" />
            </div>
            <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-center">Músicos</h2>
            <p className="text-muted-foreground text-center text-xs sm:text-sm">
              Instrumentistas
            </p>
          </CardContent>
        </Card>

        {/* Reemplazo de Multimedia */}
        <Card 
          className="cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border-2 hover:border-cyan-500 hover:shadow-xl group active:scale-[0.98]"
          onClick={() => setMode('multimedia')}
        >
          <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px]">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-cyan-500/30 transition-colors">
              <Monitor className="w-6 h-6 sm:w-10 sm:h-10 text-cyan-500" />
            </div>
            <h2 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-center">Multimedia</h2>
            <p className="text-muted-foreground text-center text-xs sm:text-sm">
              Proyección y sonido
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDirectorSection = () => (
    <div className="space-y-4">
      <Tabs defaultValue="request" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request" className="flex items-center gap-2 text-xs sm:text-sm">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Solicitar</span> Reemplazo
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Solicitudes</span> Pendientes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-4">
          <DirectorChangeRequest
            serviceId=""
            currentDirector=""
            serviceDate=""
            serviceTitle=""
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <DirectorRequestResponse />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <DirectorReplacementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );

  const getTitle = () => {
    switch (mode) {
      case 'director': return 'Reemplazo de Directores';
      case 'voice': return 'Reemplazo de Voces';
      case 'musician': return 'Reemplazo de Músicos';
      case 'multimedia': return 'Reemplazo de Multimedia';
      default: return 'Reemplazos';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'director': return <UserCheck className="w-5 h-5 text-blue-500" />;
      case 'voice': return <Mic className="w-5 h-5 text-purple-500" />;
      case 'musician': return <Guitar className="w-5 h-5 text-orange-500" />;
      case 'multimedia': return <Monitor className="w-5 h-5 text-cyan-500" />;
      default: return <RefreshCw className="w-5 h-5 text-white" />;
    }
  };

  if (mode === 'selector') {
    return (
      <div className="container mx-auto p-3 sm:p-6">
        {renderModeSelector()}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMode('selector')}
          className="h-8 w-8 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
          {getIcon()}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold arcana-gradient-text truncate">{getTitle()}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Gestión de solicitudes</p>
        </div>
      </div>

      {mode === 'director' && renderDirectorSection()}
      {mode === 'voice' && <VoiceReplacementRequest />}
      {mode === 'musician' && <MusicianReplacementRequest />}
      {mode === 'multimedia' && <MultimediaReplacementRequest />}
    </div>
  );
};

export default DirectorReplacements;
