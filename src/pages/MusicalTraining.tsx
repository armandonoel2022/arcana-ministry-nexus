import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Guitar, Piano, Mic2, Play, Pause, Trophy, Calendar, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  completed: boolean;
}

interface UserProgress {
  current_level: string;
  exercises_completed: number;
  weekly_goal: number;
  streak_days: number;
}

const MusicalTraining = () => {
  const { toast } = useToast();
  const [instrument, setInstrument] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState<string>("beginner");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isPracticing, setIsPracticing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const instruments = [
    { value: "guitar", label: "Guitarra", icon: Guitar },
    { value: "piano", label: "Piano", icon: Piano },
    { value: "bass", label: "Bajo", icon: Music2 },
    { value: "drums", label: "Batería", icon: Mic2 },
    { value: "violin", label: "Violín", icon: Music2 },
    { value: "flute", label: "Flauta", icon: Music2 }
  ];

  const exercisesByInstrument = {
    guitar: {
      beginner: [
        {
          id: "g1",
          name: "Acordes Básicos",
          description: "Do, Re, Mi - posiciones básicas",
          difficulty: "beginner" as const,
          duration: 10,
          completed: false
        },
        {
          id: "g2",
          name: "Rasgueo Simple",
          description: "Patrones básicos de rasgueo",
          difficulty: "beginner" as const,
          duration: 15,
          completed: false
        }
      ],
      intermediate: [
        {
          id: "g3",
          name: "Acordes con Cejilla",
          description: "Técnica de cejilla y acordes móviles",
          difficulty: "intermediate" as const,
          duration: 20,
          completed: false
        }
      ],
      advanced: [
        {
          id: "g4",
          name: "Fingerpicking Avanzado",
          description: "Técnicas complejas de fingerpicking",
          difficulty: "advanced" as const,
          duration: 30,
          completed: false
        }
      ]
    },
    piano: {
      beginner: [
        {
          id: "p1",
          name: "Escalas Mayores",
          description: "Do Mayor en ambas manos",
          difficulty: "beginner" as const,
          duration: 12,
          completed: false
        },
        {
          id: "p2",
          name: "Acordes Triada",
          description: "Acordes básicos de tres notas",
          difficulty: "beginner" as const,
          duration: 18,
          completed: false
        }
      ],
      intermediate: [
        {
          id: "p3",
          name: "Inversiones de Acordes",
          description: "Primera y segunda inversión",
          difficulty: "intermediate" as const,
          duration: 25,
          completed: false
        }
      ],
      advanced: [
        {
          id: "p4",
          name: "Voicing Jazz",
          description: "Acordes extendidos y alterados",
          difficulty: "advanced" as const,
          duration: 35,
          completed: false
        }
      ]
    }
  };

  useEffect(() => {
    loadUserProgress();
    if (instrument && exercisesByInstrument[instrument as keyof typeof exercisesByInstrument]) {
      const instrumentExercises = exercisesByInstrument[instrument as keyof typeof exercisesByInstrument];
      setExercises(instrumentExercises[currentLevel as keyof typeof instrumentExercises] || []);
    }
  }, [currentLevel, instrument]);

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('instrument_training')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setInstrument(data.instrument);
        setCurrentLevel(data.current_level);
        setUserProgress({
          current_level: data.current_level,
          exercises_completed: data.exercises_completed,
          weekly_goal: data.weekly_goal,
          streak_days: data.streak_days
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveInstrument = async (selectedInstrument: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('instrument_training')
        .upsert({
          user_id: user.id,
          instrument: selectedInstrument,
          current_level: currentLevel,
          exercises_completed: 0,
          weekly_goal: 5,
          streak_days: 0
        });

      if (error) throw error;

      setInstrument(selectedInstrument);
      toast({
        title: "Instrumento configurado",
        description: `Seleccionaste: ${instruments.find(i => i.value === selectedInstrument)?.label}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const startPractice = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsPracticing(true);
    
    // Simular práctica por duración del ejercicio
    setTimeout(() => {
      completeExercise(exercise.id);
      setIsPracticing(false);
    }, exercise.duration * 1000);

    toast({
      title: "Práctica iniciada",
      description: `${exercise.name} - ${exercise.duration} minutos`,
    });
  };

  const completeExercise = async (exerciseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('training_progress')
        .insert({
          user_id: user.id,
          training_type: 'musical',
          exercise_name: selectedExercise?.name || '',
          duration_minutes: selectedExercise?.duration || 0,
          difficulty_level: selectedExercise?.difficulty || 'beginner'
        });

      if (error) throw error;

      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, completed: true } : ex
      ));

      toast({
        title: "¡Práctica completada!",
        description: "Has ganado +15 puntos de experiencia",
      });

      loadUserProgress();
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const selectedInstrumentData = instruments.find(i => i.value === instrument);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Music2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Entrenamiento Musical</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prácticas Completadas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.exercises_completed || 0}</div>
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
            <Music2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.exercises_completed || 0}/{userProgress?.weekly_goal || 5}</div>
            <Progress value={((userProgress?.exercises_completed || 0) / (userProgress?.weekly_goal || 5)) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exercises" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises">
          {!instrument ? (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona un Instrumento</CardTitle>
                <CardDescription>
                  Primero configura tu instrumento principal en la pestaña Configuración
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedInstrumentData?.icon && (
                    <selectedInstrumentData.icon className="h-5 w-5" />
                  )}
                  <span className="font-medium">{selectedInstrumentData?.label}</span>
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
                {exercises.map((exercise) => (
                  <Card key={exercise.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        <Badge variant={exercise.difficulty === 'beginner' ? 'secondary' : exercise.difficulty === 'intermediate' ? 'default' : 'destructive'}>
                          {exercise.difficulty === 'beginner' ? 'Principiante' : exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                        </Badge>
                      </div>
                      <CardDescription>{exercise.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{exercise.duration} min</span>
                        <Button
                          onClick={() => startPractice(exercise)}
                          disabled={isPracticing || exercise.completed}
                          className="flex items-center gap-2"
                        >
                          {isPracticing && selectedExercise?.id === exercise.id ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Practicando...
                            </>
                          ) : exercise.completed ? (
                            "Completado"
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Practicar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                    {exercise.completed && (
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
              <CardTitle>Configuración de Instrumento</CardTitle>
              <CardDescription>
                Selecciona tu instrumento principal para ejercicios personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Instrumento Principal</label>
                <Select value={instrument} onValueChange={saveInstrument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu instrumento" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((inst) => (
                      <SelectItem key={inst.value} value={inst.value}>
                        <div className="flex items-center gap-2">
                          <inst.icon className="h-4 w-4" />
                          {inst.label}
                        </div>
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

export default MusicalTraining;