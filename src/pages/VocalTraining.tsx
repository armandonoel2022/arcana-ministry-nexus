import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Mic, Play, Pause, Trophy, Calendar, Volume2, Square, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceAnalysis } from "@/hooks/useVoiceAnalysis";
import { VoiceAnalysisDisplay } from "@/components/vocal/VoiceAnalysisDisplay";

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

const VocalTraining = () => {
  const { toast } = useToast();
  const [voiceType, setVoiceType] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState<string>("beginner");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const { analysisData, startRecording, stopRecording, getPitchNote } = useVoiceAnalysis();

  const voiceTypes = [
    { value: "soprano", label: "Soprano" },
    { value: "mezzo-soprano", label: "Mezzo-Soprano" },
    { value: "alto", label: "Alto" },
    { value: "tenor", label: "Tenor" },
    { value: "baritone", label: "Barítono" },
    { value: "bass", label: "Bajo" }
  ];

  const exercisesByLevel = {
    beginner: [
      {
        id: "1",
        name: "Respiración Diafragmática",
        description: "Coloca una mano en el pecho y otra en el diafragma. Inhala lentamente por la nariz, asegurándote de que se mueva solo la mano del diafragma. Exhala lentamente por la boca durante 8 tiempos.",
        difficulty: "beginner" as const,
        duration: 5,
        completed: false
      },
      {
        id: "2", 
        name: "Escalas Básicas",
        description: "Canta Do-Re-Mi-Fa-Sol-La-Si-Do manteniendo una respiración controlada. Asegúrate de que cada nota sea clara y en el tono correcto. Repite subiendo medio tono cada vez.",
        difficulty: "beginner" as const,
        duration: 10,
        completed: false
      }
    ],
    intermediate: [
      {
        id: "3",
        name: "Vocalización con Consonantes",
        description: "Practica Ma-Me-Mi-Mo-Mu en escalas ascendentes y descendentes. Mantén la posición de la lengua relajada y asegúrate de que cada vocal sea clara y resonante.",
        difficulty: "intermediate" as const,
        duration: 15,
        completed: false
      },
      {
        id: "4",
        name: "Control de Vibrato",
        description: "Sostén una nota larga y estable, luego introduce gradualmente el vibrato. Controla la velocidad y amplitud del vibrato usando el apoyo diafragmático.",
        difficulty: "intermediate" as const,
        duration: 20,
        completed: false
      }
    ],
    advanced: [
      {
        id: "5",
        name: "Agilidad Vocal",
        description: "Ejecuta melismas rápidos y precisos. Practica secuencias de 16vas notas manteniendo claridad en cada nota. Aumenta gradualmente la velocidad sin perder articulación.",
        difficulty: "advanced" as const,
        duration: 25,
        completed: false
      },
      {
        id: "6",
        name: "Expresión e Interpretación",
        description: "Trabaja dinámicas contrastantes, fraseo musical y conexión emocional. Practica crescendos, diminuendos y cambios de color vocal para expresar diferentes emociones.",
        difficulty: "advanced" as const,
        duration: 30,
        completed: false
      }
    ]
  };

  useEffect(() => {
    loadUserProgress();
    setExercises(exercisesByLevel[currentLevel as keyof typeof exercisesByLevel]);
  }, [currentLevel]);

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vocal_training')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setVoiceType(data.voice_type);
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

  const saveVoiceType = async (type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('vocal_training')
        .upsert({
          user_id: user.id,
          voice_type: type,
          current_level: currentLevel,
          exercises_completed: 0,
          weekly_goal: 5,
          streak_days: 0
        });

      if (error) throw error;

      setVoiceType(type);
      toast({
        title: "Configuración guardada",
        description: `Tipo de voz: ${type}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const generateAudioInstruction = async (exerciseDescription: string, exerciseName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: `Ejercicio: ${exerciseName}. ${exerciseDescription}. Respira profundamente y toma tu tiempo. Cuando estés listo, puedes comenzar.`,
          voice: 'nova'
        }
      });

      if (error) throw error;

      // Create audio from base64
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      return audio;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la instrucción de audio.",
        variant: "destructive"
      });
      return null;
    }
  };

  const playAudioInstruction = async (exercise: Exercise) => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlayingAudio(false);
    }

    setIsPlayingAudio(true);
    const audio = await generateAudioInstruction(exercise.description, exercise.name);
    if (!audio) {
      setIsPlayingAudio(false);
      return;
    }

    setCurrentAudio(audio);

    audio.onended = () => {
      setIsPlayingAudio(false);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentAudio(null);
      toast({
        title: "Error",
        description: "No se pudo reproducir la instrucción.",
        variant: "destructive"
      });
    };

    try {
      await audio.play();
    } catch (error) {
      setIsPlayingAudio(false);
      setCurrentAudio(null);
      console.error('Error playing audio:', error);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlayingAudio(false);
      setCurrentAudio(null);
    }
  };

  const startExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    
    // Get target pitch based on exercise type
    const targetPitch = getTargetPitchForExercise(exercise);
    
    const success = await startRecording(targetPitch);
    if (!success) {
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Ejercicio iniciado",
      description: `${exercise.name} - ${exercise.duration} minutos`,
    });
    
    // Auto-stop after exercise duration
    setTimeout(() => {
      stopExercise();
      toast({
        title: "Ejercicio completado",
        description: "Puedes marcarlo como terminado.",
      });
    }, exercise.duration * 1000);
  };

  const stopExercise = () => {
    stopRecording();
    setSelectedExercise(null);
  };

  const getTargetPitchForExercise = (exercise: Exercise): number | undefined => {
    // Define target pitches for different exercise types
    if (exercise.name.toLowerCase().includes('do re mi') || exercise.name.toLowerCase().includes('escalas')) return 262; // C4
    if (exercise.name.toLowerCase().includes('sostenido')) return 294; // D4
    if (exercise.name.toLowerCase().includes('vibrato')) return 330; // E4
    if (exercise.name.toLowerCase().includes('arpegio') || exercise.name.toLowerCase().includes('agilidad')) return 349; // F4
    return undefined;
  };

  const completeExercise = async (exerciseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('training_progress')
        .insert({
          user_id: user.id,
          training_type: 'vocal',
          exercise_name: selectedExercise?.name || '',
          duration_minutes: selectedExercise?.duration || 0,
          difficulty_level: selectedExercise?.difficulty || 'beginner'
        });

      if (error) throw error;

      // Actualizar ejercicios completados
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, completed: true } : ex
      ));

      toast({
        title: "¡Ejercicio completado!",
        description: "Has ganado +10 puntos de experiencia",
      });

      loadUserProgress();
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Mic className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Entrenamiento Vocal</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ejercicios Completados</CardTitle>
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
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress?.exercises_completed || 0}/{userProgress?.weekly_goal || 5}</div>
            <Progress value={((userProgress?.exercises_completed || 0) / (userProgress?.weekly_goal || 5)) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Real-time Voice Analysis */}
      <VoiceAnalysisDisplay
        pitch={analysisData.pitch}
        volume={analysisData.volume}
        targetPitch={analysisData.targetPitch}
        pitchNote={getPitchNote(analysisData.pitch)}
        isRecording={analysisData.isRecording}
      />

      <Tabs defaultValue="exercises" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
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
                       <div className="flex items-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => playAudioInstruction(exercise)}
                           disabled={isPlayingAudio}
                           className="flex items-center gap-1"
                         >
                           <Volume2 className="h-4 w-4" />
                           Escuchar
                         </Button>
                         {isPlayingAudio && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={stopAudio}
                             className="flex items-center gap-1"
                           >
                             <Square className="h-4 w-4" />
                             Detener
                           </Button>
                         )}
                          <Button
                            variant={analysisData.isRecording && selectedExercise?.id === exercise.id ? "destructive" : "default"}
                            onClick={() => {
                              if (analysisData.isRecording && selectedExercise?.id === exercise.id) {
                                stopExercise();
                                toast({
                                  title: "Ejercicio detenido",
                                  description: "Has detenido el ejercicio.",
                                });
                              } else {
                                startExercise(exercise);
                              }
                            }}
                            disabled={exercise.completed}
                            className="flex items-center gap-2"
                          >
                            {analysisData.isRecording && selectedExercise?.id === exercise.id ? (
                              <>
                                <MicOff className="h-4 w-4" />
                                Detener
                              </>
                            ) : exercise.completed ? (
                              "Completado"
                            ) : (
                              <>
                                <Mic className="h-4 w-4" />
                                Iniciar
                              </>
                            )}
                          </Button>
                       </div>
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
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Voz</CardTitle>
              <CardDescription>
                Selecciona tu tipo de voz para ejercicios personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Voz</label>
                <Select value={voiceType} onValueChange={saveVoiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu tipo de voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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

export default VocalTraining;