import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileText,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLiveEventSync } from '@/hooks/useLiveEventSync';
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
  notes?: string;
  highlight_color?: string;
}

interface LiveEventControllerProps {
  onBack: () => void;
  onSwitchToProgramming: (eventId: string) => void;
}

// Color mapping for departments with abbreviations
const departmentColors: Record<string, { bg: string; text: string; abbr: string }> = {
  'direccion de camara': { bg: 'bg-green-400', text: 'text-green-900', abbr: 'DC' },
  'dirección de cámara': { bg: 'bg-green-400', text: 'text-green-900', abbr: 'DC' },
  'camara': { bg: 'bg-green-400', text: 'text-green-900', abbr: 'DC' },
  'direccion de piso': { bg: 'bg-pink-400', text: 'text-pink-900', abbr: 'DP' },
  'dirección de piso': { bg: 'bg-pink-400', text: 'text-pink-900', abbr: 'DP' },
  'piso': { bg: 'bg-pink-400', text: 'text-pink-900', abbr: 'DP' },
  'multimedia': { bg: 'bg-yellow-400', text: 'text-yellow-900', abbr: 'MULT' },
  'ministerio de adoracion': { bg: 'bg-cyan-400', text: 'text-cyan-900', abbr: 'ADOR' },
  'ministerio de adoración': { bg: 'bg-cyan-400', text: 'text-cyan-900', abbr: 'ADOR' },
  'adoracion': { bg: 'bg-cyan-400', text: 'text-cyan-900', abbr: 'ADOR' },
  'adoración': { bg: 'bg-cyan-400', text: 'text-cyan-900', abbr: 'ADOR' },
  'coro': { bg: 'bg-cyan-400', text: 'text-cyan-900', abbr: 'CORO' },
};

// Helper to highlight department mentions in notes
const highlightDepartments = (text: string, isMobile: boolean = false) => {
  if (!text) return null;
  
  let result = text;
  const segments: { text: string; color?: { bg: string; text: string } }[] = [];
  
  // Create regex pattern for all department names
  const patterns = Object.keys(departmentColors).map(dept => 
    dept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');
  
  const regex = new RegExp(`(${patterns})`, 'gi');
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    
    // Add highlighted match
    const matchedText = match[0].toLowerCase();
    const colorInfo = departmentColors[matchedText];
    if (colorInfo) {
      segments.push({ 
        text: isMobile ? colorInfo.abbr : match[0], 
        color: colorInfo 
      });
    } else {
      segments.push({ text: match[0] });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }
  
  return (
    <span>
      {segments.map((seg, idx) => 
        seg.color ? (
          <span 
            key={idx} 
            className={cn("px-1 py-0.5 rounded font-medium", seg.color.bg, seg.color.text)}
          >
            {seg.text}
          </span>
        ) : (
          <span key={idx}>{seg.text}</span>
        )
      )}
    </span>
  );
};

const LiveEventController: React.FC<LiveEventControllerProps> = ({ onBack, onSwitchToProgramming }) => {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showCompletedItems, setShowCompletedItems] = useState(false);

  const {
    timerState,
    currentItem,
    nextItem,
    plannedSeconds,
    timeRemaining,
    isOvertime,
    formatTime,
    startTimer,
    stopSection,
    nextSection,
    skipToSection,
    restoreSection,
    togglePause,
    resetEvent,
    getStatistics,
    saveStatistics,
    pendingItems,
    completedItemsList,
    isLoading: syncLoading,
  } = useLiveEventSync(selectedEvent?.id || null, programItems);

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

  const toggleNotes = (itemId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const stats = getStatistics();
  const isEventFinished = timerState.eventEndTime !== null;
  const progress = programItems.length > 0 
    ? (timerState.completedItems.length / programItems.length) * 100 
    : 0;

  // Event Selection View
  if (!selectedEvent) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-2 sm:px-3">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Modo En Vivo</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Selecciona el evento a ejecutar</p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 max-w-2xl">
          {events.map((event) => (
            <Card 
              key={event.id}
              className="cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => setSelectedEvent(event)}
            >
              <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base truncate">{event.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  {event.location && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{event.location}</p>
                  )}
                </div>
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 shrink-0 ml-2" />
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No hay eventos disponibles
            </p>
          )}
        </div>
      </div>
    );
  }

  // Stats View
  if (showStats || isEventFinished) {
    // Save statistics when event ends
    if (isEventFinished && !showStats) {
      saveStatistics();
    }

    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => { setShowStats(false); if (isEventFinished) resetEvent(); }}>
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isEventFinished ? 'Nuevo Evento' : 'Volver'}</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 sm:w-8 sm:h-8" />
                <span className="hidden sm:inline">Estadísticas del Evento</span>
                <span className="sm:hidden">Estadísticas</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{selectedEvent.title}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-primary/10">
            <CardContent className="p-4 sm:p-6 text-center">
              <Timer className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-primary" />
              <p className="text-xs sm:text-sm text-muted-foreground">Tiempo Planificado</p>
              <p className="text-xl sm:text-2xl font-bold">{formatTime(stats.totalPlannedSeconds)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-4 sm:p-6 text-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-500" />
              <p className="text-xs sm:text-sm text-muted-foreground">Tiempo Real</p>
              <p className="text-xl sm:text-2xl font-bold">{formatTime(stats.totalActualSeconds)}</p>
            </CardContent>
          </Card>
          <Card className={cn(
            "border-2",
            stats.isAhead ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"
          )}>
            <CardContent className="p-4 sm:p-6 text-center">
              {stats.isAhead ? (
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-red-500" />
              )}
              <p className="text-xs sm:text-sm text-muted-foreground">Diferencia</p>
              <p className={cn("text-xl sm:text-2xl font-bold", stats.isAhead ? "text-green-500" : "text-red-500")}>
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
          <CardHeader className="py-3 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ListChecks className="w-4 h-4 sm:w-5 sm:h-5" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {stats.itemStats.filter(s => s.completed && Math.abs(s.difference) > 60).map(item => (
                <li key={item.id} className="flex items-start gap-2 text-xs sm:text-sm">
                  {item.difference > 0 ? (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  )}
                  <span>
                    <strong>{item.title}</strong>: 
                    {item.difference > 0 
                      ? ` Excedido por ${formatTime(item.difference)}`
                      : ` Terminó ${formatTime(Math.abs(item.difference))} antes`
                    }
                  </span>
                </li>
              ))}
              {stats.itemStats.filter(s => s.completed && Math.abs(s.difference) > 60).length === 0 && (
                <li className="text-muted-foreground text-xs sm:text-sm">
                  ¡Excelente! Todas las secciones se ejecutaron dentro del tiempo esperado.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Detailed breakdown */}
        <Card>
          <CardHeader className="py-3 sm:py-6">
            <CardTitle className="text-sm sm:text-base">Desglose por Sección</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {stats.itemStats.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{item.title}</p>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
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
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <div className="border-b p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)} className="shrink-0 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cambiar</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm sm:text-base truncate">{selectedEvent.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {timerState.completedItems.length}/{programItems.length} secciones
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSwitchToProgramming(selectedEvent.id)}
              className="text-xs px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Ir a </span>Programación
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowStats(true)}
              className="px-2 sm:px-3"
            >
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Estadísticas</span>
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

      {/* Main Timer Display - Mobile Optimized */}
      <div className="px-3 py-3 sm:px-6 sm:py-6">
        <div className="flex flex-col items-center justify-center py-3 sm:py-8">
          {timerState.isPreparationPhase ? (
            <>
              <p className="text-sm sm:text-xl text-muted-foreground mb-2 sm:mb-4 text-center">
                Preparación para siguiente sección
              </p>
              <div className="text-5xl sm:text-8xl md:text-9xl font-mono font-bold text-yellow-500 mb-2 sm:mb-4">
                {formatTime(timerState.preparationSeconds)}
              </div>
              {nextItem && (
                <div className="text-center px-4">
                  <p className="text-sm sm:text-lg text-muted-foreground">
                    Siguiente: <span className="font-medium text-foreground">{nextItem.title}</span>
                  </p>
                  {nextItem.responsible_person && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      <User className="w-3 h-3 inline mr-1" />
                      {highlightDepartments(nextItem.responsible_person, true)}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : currentItem ? (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <span className="px-2 sm:px-3 py-1 rounded-full bg-primary/20 text-xs sm:text-sm">
                  Sección {timerState.currentItemIndex + 1} de {programItems.length}
                </span>
                {isOvertime && (
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-xs sm:text-sm flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Excedido
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-4 px-4 leading-tight">
                {currentItem.title}
              </h2>
              <div className={cn(
                "text-5xl sm:text-8xl md:text-9xl font-mono font-bold mb-2 sm:mb-4 transition-colors",
                isOvertime ? "text-red-500" : timerState.isRunning ? "text-green-500" : "text-foreground"
              )}>
                {isOvertime ? '+' : ''}{formatTime(timerState.isRunning ? (isOvertime ? Math.abs(timeRemaining) : timerState.elapsedSeconds) : 0)}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-base text-muted-foreground">
                <span>Plan: {formatTime(plannedSeconds)}</span>
                {timerState.isRunning && !isOvertime && (
                  <span>Restante: {formatTime(timeRemaining)}</span>
                )}
              </div>
              {currentItem.responsible_person && (
                <p className="mt-2 sm:mt-4 text-xs sm:text-lg text-center">
                  <span className="text-muted-foreground">Responsable: </span>
                  {highlightDepartments(currentItem.responsible_person, true)}
                </p>
              )}
              {currentItem.notes && (
                <Collapsible className="w-full max-w-lg mt-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver notas
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-3 bg-muted/50 rounded-lg text-xs sm:text-sm">
                    {highlightDepartments(currentItem.notes, false)}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          ) : (
            <p className="text-sm sm:text-xl text-muted-foreground">No hay secciones en el programa</p>
          )}
        </div>

        {/* Controls - Mobile Optimized */}
        {currentItem && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
            {!timerState.isRunning ? (
              <Button 
                size="lg" 
                className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8"
                onClick={startTimer}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Iniciar
              </Button>
            ) : timerState.isPreparationPhase ? (
              // Preparation phase: only Pause and Skip
              <>
                <Button 
                  size="default"
                  variant="outline"
                  onClick={togglePause}
                  className="px-4 sm:px-6"
                >
                  {timerState.isPaused ? (
                    <>
                      <Play className="w-5 h-5 mr-1 sm:mr-2" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-1 sm:mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button 
                  size="default"
                  variant="outline"
                  onClick={nextSection}
                  className="px-4 sm:px-6"
                >
                  <SkipForward className="w-5 h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Saltar Preparación</span>
                  <span className="sm:hidden">Saltar</span>
                </Button>
              </>
            ) : (
              // Active section: Pause and Stop
              <>
                <Button 
                  size="default"
                  variant="outline"
                  onClick={togglePause}
                  className="px-4 sm:px-6"
                >
                  {timerState.isPaused ? (
                    <>
                      <Play className="w-5 h-5 mr-1 sm:mr-2" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-1 sm:mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button 
                  size="default"
                  variant="destructive"
                  onClick={stopSection}
                  className="px-4 sm:px-6"
                >
                  <Square className="w-5 h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Finalizar Sección</span>
                  <span className="sm:hidden">Finalizar</span>
                </Button>
              </>
            )}
          </div>
        )}

        {/* Completed Items - Restorable */}
        {completedItemsList.length > 0 && (
          <Collapsible open={showCompletedItems} onOpenChange={setShowCompletedItems} className="mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full flex justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Secciones Completadas ({completedItemsList.length})
                </span>
                {showCompletedItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {completedItemsList.map((item) => {
                const realIndex = programItems.findIndex(p => p.id === item.id);
                const actualTime = timerState.itemActualTimes[item.id] || 0;
                
                return (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-medium shrink-0">
                      {realIndex + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate text-green-700 dark:text-green-300">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(actualTime)} / {item.duration_minutes} min
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreSection(item.id)}
                      className="shrink-0 text-xs px-2"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Restaurar</span>
                    </Button>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Pending Items List - Grid Layout */}
        <Card className="mx-0">
          <CardHeader className="py-2 sm:py-4">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <span>Secciones Pendientes</span>
              <span className="text-xs font-normal text-muted-foreground">
                {pendingItems.length} restantes
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 sm:pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-[50vh] overflow-y-auto">
              {pendingItems.map((item) => {
                const isCurrentItem = item.id === currentItem?.id;
                const realIndex = programItems.findIndex(p => p.id === item.id);
                const hasNotes = !!item.notes;
                const isExpanded = expandedNotes.has(item.id);
                
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "rounded-lg transition-colors border",
                      isCurrentItem 
                        ? "bg-green-500/20 border-green-500" 
                        : "bg-muted/50 hover:bg-muted border-transparent",
                      item.highlight_color && `border-l-4`,
                    )}
                    style={item.highlight_color ? { borderLeftColor: item.highlight_color } : undefined}
                  >
                    <div 
                      className="p-2 sm:p-3 cursor-pointer"
                      onClick={() => !timerState.isRunning && skipToSection(realIndex)}
                    >
                      {/* Header Row */}
                      <div className="flex items-start gap-2">
                        <span className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5",
                          isCurrentItem ? "bg-green-500 text-white" : "bg-muted-foreground/20"
                        )}>
                          {realIndex + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn(
                              "font-medium text-xs sm:text-sm",
                              isCurrentItem && "text-green-700 dark:text-green-300"
                            )}>
                              {item.title}
                            </p>
                            {isCurrentItem && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-green-500 text-white rounded shrink-0">
                                ACTUAL
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {item.time_slot} • {item.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      
                      {/* Responsible Person */}
                      {item.responsible_person && (
                        <div className="mt-1.5 pl-7 sm:pl-8">
                          <p className="text-[10px] sm:text-xs">
                            <User className="w-3 h-3 inline mr-1 text-muted-foreground" />
                            {highlightDepartments(item.responsible_person, true)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes Section */}
                    {hasNotes && (
                      <div className="border-t border-muted px-2 sm:px-3 py-1.5">
                        <button 
                          onClick={() => toggleNotes(item.id)}
                          className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                        >
                          <FileText className="w-3 h-3" />
                          {isExpanded ? 'Ocultar notas' : 'Ver notas'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground whitespace-pre-wrap">
                            {highlightDepartments(item.notes || '', false)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {pendingItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-xs sm:text-sm col-span-full">
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