import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ListChecks,
  Timer,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLiveEventTimer } from '@/hooks/useLiveEventTimer';
import { cn } from '@/lib/utils';

interface SpecialEvent {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description: string;
}

interface ProgramItem {
  id: string;
  event_id: string;
  time_slot: string;
  title: string;
  description?: string;
  responsible_person?: string;
  duration_minutes: number;
  item_order: number;
}

interface LiveEventControllerProps {
  onBack: () => void;
  onSwitchToProgramming: (eventId: string) => void;
}

const LiveEventController: React.FC<LiveEventControllerProps> = ({ onBack, onSwitchToProgramming }) => {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const {
    timerState,
    currentItem,
    plannedSeconds,
    timeRemaining,
    isOvertime,
    formatTime,
    startTimer,
    stopSection,
    nextSection,
    skipToSection,
    togglePause,
    resetEvent,
    getStatistics,
    pendingItems,
  } = useLiveEventTimer(programItems);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchProgramItems(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramItems = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_program_items')
        .select('*')
        .eq('event_id', eventId)
        .order('item_order', { ascending: true });

      if (error) throw error;
      setProgramItems(data || []);
    } catch (error: any) {
      toast.error('Error al cargar programa');
    }
  };

  const stats = getStatistics();
  const isEventFinished = timerState.eventEndTime !== null;
  const progress = programItems.length > 0 
    ? (timerState.completedItems.length / programItems.length) * 100 
    : 0;

  // Event Selection View
  if (!selectedEvent) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modo En Vivo</h1>
            <p className="text-muted-foreground">Selecciona el evento a ejecutar</p>
          </div>
        </div>

        <div className="grid gap-4 max-w-2xl">
          {events.map((event) => (
            <Card 
              key={event.id}
              className="cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => setSelectedEvent(event)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  {event.location && (
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  )}
                </div>
                <Play className="w-6 h-6 text-green-500" />
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No hay eventos disponibles
            </p>
          )}
        </div>
      </div>
    );
  }

  // Stats View
  if (showStats || isEventFinished) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => { setShowStats(false); if (isEventFinished) resetEvent(); }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isEventFinished ? 'Nuevo Evento' : 'Volver'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Estadísticas del Evento
              </h1>
              <p className="text-muted-foreground">{selectedEvent.title}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/10">
            <CardContent className="p-6 text-center">
              <Timer className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Tiempo Planificado</p>
              <p className="text-2xl font-bold">{formatTime(stats.totalPlannedSeconds)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Tiempo Real</p>
              <p className="text-2xl font-bold">{formatTime(stats.totalActualSeconds)}</p>
            </CardContent>
          </Card>
          <Card className={cn(
            "border-2",
            stats.isAhead ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"
          )}>
            <CardContent className="p-6 text-center">
              {stats.isAhead ? (
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              )}
              <p className="text-sm text-muted-foreground">Diferencia</p>
              <p className={cn("text-2xl font-bold", stats.isAhead ? "text-green-500" : "text-red-500")}>
                {stats.isAhead ? '-' : '+'}{formatTime(stats.difference)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.isAhead ? 'Adelantado' : 'Atrasado'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Recomendaciones para Futuros Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.itemStats.filter(s => s.completed && Math.abs(s.difference) > 60).map(item => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  {item.difference > 0 ? (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  )}
                  <span>
                    <strong>{item.title}</strong>: 
                    {item.difference > 0 
                      ? ` Se excedió por ${formatTime(item.difference)}. Considerar asignar más tiempo o simplificar.`
                      : ` Terminó ${formatTime(Math.abs(item.difference))} antes. Podría reducirse el tiempo asignado.`
                    }
                  </span>
                </li>
              ))}
              {stats.itemStats.filter(s => s.completed && Math.abs(s.difference) > 60).length === 0 && (
                <li className="text-muted-foreground">
                  ¡Excelente! Todas las secciones se ejecutaron dentro del tiempo esperado.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Detailed breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Sección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.itemStats.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Plan: {formatTime(item.plannedSeconds)}</span>
                      {item.completed && (
                        <>
                          <span>Real: {formatTime(item.actualSeconds)}</span>
                          <span className={item.difference > 0 ? 'text-red-500' : 'text-green-500'}>
                            {item.difference > 0 ? '+' : '-'}{formatTime(Math.abs(item.difference))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Live Control View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cambiar Evento
            </Button>
            <div>
              <h1 className="font-bold">{selectedEvent.title}</h1>
              <p className="text-sm text-muted-foreground">
                Progreso: {timerState.completedItems.length}/{programItems.length} secciones
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSwitchToProgramming(selectedEvent.id)}
            >
              Ir a Programación
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowStats(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Estadísticas
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Timer Display */}
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-8">
          {timerState.isPreparationPhase ? (
            <>
              <p className="text-xl text-muted-foreground mb-4">Preparación para siguiente sección</p>
              <div className="text-8xl md:text-9xl font-mono font-bold text-yellow-500 mb-4">
                {formatTime(timerState.preparationSeconds)}
              </div>
              <p className="text-lg text-muted-foreground">
                Siguiente: {programItems[timerState.currentItemIndex + 1]?.title || 'Fin del evento'}
              </p>
            </>
          ) : currentItem ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-sm">
                  Sección {timerState.currentItemIndex + 1} de {programItems.length}
                </span>
                {isOvertime && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Tiempo excedido
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">{currentItem.title}</h2>
              <div className={cn(
                "text-8xl md:text-9xl font-mono font-bold mb-4 transition-colors",
                isOvertime ? "text-red-500" : timerState.isRunning ? "text-green-500" : "text-foreground"
              )}>
                {isOvertime ? '+' : ''}{formatTime(timerState.isRunning ? (isOvertime ? Math.abs(timeRemaining) : timerState.elapsedSeconds) : 0)}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Planificado: {formatTime(plannedSeconds)}</span>
                {timerState.isRunning && !isOvertime && (
                  <span>Restante: {formatTime(timeRemaining)}</span>
                )}
              </div>
              {currentItem.responsible_person && (
                <p className="mt-4 text-lg">
                  <span className="text-muted-foreground">Responsable:</span> {currentItem.responsible_person}
                </p>
              )}
            </>
          ) : (
            <p className="text-xl text-muted-foreground">No hay secciones en el programa</p>
          )}
        </div>

        {/* Controls */}
        {currentItem && (
          <div className="flex justify-center gap-4 mb-8">
            {!timerState.isRunning ? (
              <Button 
                size="lg" 
                className="bg-green-500 hover:bg-green-600 text-white px-8"
                onClick={startTimer}
              >
                <Play className="w-6 h-6 mr-2" />
                {timerState.isPreparationPhase ? 'Iniciar Siguiente' : 'Iniciar'}
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={togglePause}
                >
                  {timerState.isPaused ? (
                    <>
                      <Play className="w-6 h-6 mr-2" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <Pause className="w-6 h-6 mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button 
                  size="lg" 
                  variant="destructive"
                  onClick={stopSection}
                >
                  <Square className="w-6 h-6 mr-2" />
                  Finalizar Sección
                </Button>
              </>
            )}
            {timerState.isPreparationPhase && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={nextSection}
              >
                <SkipForward className="w-6 h-6 mr-2" />
                Saltar Preparación
              </Button>
            )}
          </div>
        )}

        {/* Pending Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Secciones Pendientes</span>
              <span className="text-sm font-normal text-muted-foreground">
                {pendingItems.length} restantes
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingItems.map((item, idx) => {
                const isCurrentItem = item.id === currentItem?.id;
                const realIndex = programItems.findIndex(p => p.id === item.id);
                
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer",
                      isCurrentItem 
                        ? "bg-green-500/20 border-2 border-green-500" 
                        : "bg-muted/50 hover:bg-muted"
                    )}
                    onClick={() => !timerState.isRunning && skipToSection(realIndex)}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      isCurrentItem ? "bg-green-500 text-white" : "bg-muted-foreground/20"
                    )}>
                      {realIndex + 1}
                    </span>
                    <div className="flex-1">
                      <p className={cn("font-medium", isCurrentItem && "text-green-700 dark:text-green-300")}>
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.time_slot} • {item.duration_minutes} min
                      </p>
                    </div>
                    {isCurrentItem && (
                      <span className="px-2 py-1 text-xs bg-green-500 text-white rounded">
                        En curso
                      </span>
                    )}
                  </div>
                );
              })}
              {pendingItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  ¡Todas las secciones completadas!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveEventController;
