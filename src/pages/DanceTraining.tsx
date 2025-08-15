import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Play, Pause, Trophy, Calendar, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Routine {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  completed: boolean;
  style: string;
}

interface UserProgress {
  current_level: string;
  routines_completed: number;
  weekly_goal: number;
  streak_days: number;
}

const DanceTraining = () => {
  const { toast } = useToast();
  const [danceStyle, setDanceStyle] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState<string>("beginner");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isDancing, setIsDancing] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  const danceStyles = [
    { value: "contemporary", label: "Danza Contemporánea" },
    { value: "liturgical", label: "Danza Litúrgica" },
    { value: "prophetic", label: "Danza Profética" },
    { value: "praise", label: "Danza de Alabanza" },
    { value: "worship", label: "Danza de Adoración" },
    { value: "flags", label: "Danza con Banderas" }
  ];

  const routinesByStyle = {
    contemporary: {
      beginner: [
        {
          id: "c1",
          name: "Movimientos Básicos",
          description: "Postura, equilibrio y movimientos fluidos básicos",
          difficulty: "beginner" as const,
          duration: 15,
          completed: false,
          style: "contemporary"
        },
        {
          id: "c2",
          name: "Secuencia Suave",
          description: "Combinación de brazos y desplazamientos suaves",
          difficulty: "beginner" as const,
          duration: 20,
          completed: false,
          style: "contemporary"
        }
      ],
      intermediate: [
        {
          id: "c3",
          name: "Expresión Corporal",
          description: "Técnicas de expresión emocional a través del movimiento",
          difficulty: "intermediate" as const,
          duration: 25,
          completed: false,
          style: "contemporary"
        }
      ],
      advanced: [
        {
          id: "c4",
          name: "Coreografía Completa",
          description: "Rutina completa con técnicas avanzadas",
          difficulty: "advanced" as const,
          duration: 35,
          completed: false,
          style: "contemporary"
        }
      ]
    },
    liturgical: {
      beginner: [
        {
          id: "l1",
          name: "Posturas de Adoración",
          description: "Posiciones básicas para la danza litúrgica",
          difficulty: "beginner" as const,
          duration: 12,
          completed: false,
          style: "liturgical"
        },
        {
          id: "l2",
          name: "Movimientos Reverentes",
          description: "Gestos y movimientos para el culto",
          difficulty: "beginner" as const,
          duration: 18,
          completed: false,
          style: "liturgical"
        }
      ],
      intermediate: [
        {
          id: "l3",
          name: "Danza Congregacional",
          description: "Rutinas para dirigir a la congregación",
          difficulty: "intermediate" as const,
          duration: 30,
          completed: false,
          style: "liturgical"
        }
      ],
      advanced: [
        {
          id: "l4",
          name: "Ministerio en Danza",
          description: "Técnicas avanzadas para el ministerio",
          difficulty: "advanced" as const,
          duration: 40,
          completed: false,
          style: "liturgical"
        }
      ]
    }
  };

  useEffect(() => {
    loadUserProgress();
    if (danceStyle && routinesByStyle[danceStyle as keyof typeof routinesByStyle]) {
      const styleRoutines = routinesByStyle[danceStyle as keyof typeof routinesByStyle];
      setRoutines(styleRoutines[currentLevel as keyof typeof styleRoutines] || []);
    }
  }, [currentLevel, danceStyle]);

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dance_training')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setDanceStyle(data.dance_style);
        setCurrentLevel(data.current_level);
        setUserProgress({
          current_level: data.current_level,
          routines_completed: data.routines_completed,
          weekly_goal: data.weekly_goal,
          streak_days: data.streak_days
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveDanceStyle = async (style: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('dance_training')
        .upsert({
          user_id: user.id,
          dance_style: style,
          current_level: currentLevel,
          routines_completed: 0,
          weekly_goal: 3,
          streak_days: 0
        });

      if (error) throw error;

      setDanceStyle(style);
      toast({
        title: "Estilo configurado",
        description: `Seleccionaste: ${danceStyles.find(s => s.value === style)?.label}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const startRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsDancing(true);
    
    // Simular práctica por duración de la rutina
    setTimeout(() => {
      completeRoutine(routine.id);
      setIsDancing(false);
    }, routine.duration * 1000);

    toast({
      title: "Rutina iniciada",
      description: `${routine.name} - ${routine.duration} minutos`,
    });
  };

  const completeRoutine = async (routineId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('training_progress')
        .insert({
          user_id: user.id,
          training_type: 'dance',
          exercise_name: selectedRoutine?.name || '',
          duration_minutes: selectedRoutine?.duration || 0,
          difficulty_level: selectedRoutine?.difficulty || 'beginner'
        });

      if (error) throw error;

      setRoutines(prev => prev.map(routine => 
        routine.id === routineId ? { ...routine, completed: true } : routine
      ));

      toast({
        title: "¡Rutina completada!",
        description: "Has ganado +20 puntos de experiencia",
      });

      loadUserProgress();
    } catch (error) {
      console.error('Error completing routine:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Entrenamiento de Danza</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutinas Completadas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.routines_completed || 0}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.streak_days || 0}</div>
            <p className="text-xs text-muted-foreground">días consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.routines_completed || 0}/{userProgress?.weekly_goal || 3}</div>
            <Progress value={((userProgress?.routines_completed || 0) / (userProgress?.weekly_goal || 3)) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routines" className="space-y-6">
        <TabsList>
          <TabsTrigger value="routines">Rutinas</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="routines">
          {!danceStyle ? (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona un Estilo de Danza</CardTitle>
                <CardDescription>
                  Primero configura tu estilo preferido en la pestaña Configuración
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span className="font-medium">
                    {danceStyles.find(s => s.value === danceStyle)?.label}
                  </span>
                </div>
                <Select value={currentLevel} onValueChange={setCurrentLevel}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Nivel de dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {routines.map((routine) => (
                  <Card key={routine.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{routine.name}</CardTitle>
                        <Badge variant={routine.difficulty === 'beginner' ? 'secondary' : routine.difficulty === 'intermediate' ? 'default' : 'destructive'}>
                          {routine.difficulty === 'beginner' ? 'Principiante' : routine.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                        </Badge>
                      </div>
                      <CardDescription>{routine.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{routine.duration} min</span>
                        <Button
                          onClick={() => startRoutine(routine)}
                          disabled={isDancing || routine.completed}
                          className="flex items-center gap-2"
                        >
                          {isDancing && selectedRoutine?.id === routine.id ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Practicando...
                            </>
                          ) : routine.completed ? (
                            "Completado"
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Iniciar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                    {routine.completed && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Danza</CardTitle>
              <CardDescription>
                Selecciona tu estilo de danza preferido para rutinas personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estilo de Danza</label>
                <Select value={danceStyle} onValueChange={saveDanceStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu estilo preferido" />
                  </SelectTrigger>
                  <SelectContent>
                    {danceStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DanceTraining;