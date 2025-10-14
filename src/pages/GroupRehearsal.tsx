import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music2, 
  Plus, 
  Play, 
  Mic, 
  Video,
  Users,
  Headphones,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RehearsalSession {
  id: string;
  title: string;
  session_name: string;
  description: string;
  group_id: string;
  status: string;
  backing_track_url: string | null;
  song_id: string | null;
  created_at: string;
  created_by: string;
  songs?: {
    title: string;
    artist: string;
  };
  profiles?: {
    full_name: string;
  };
}

const GroupRehearsal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useAuth();
  const [sessions, setSessions] = useState<RehearsalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const defaultTab = searchParams.get("tab") || "instrucciones";

  console.log("GroupRehearsal: Component mounted", { user: user?.id, userProfile: userProfile?.id });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log("GroupRehearsal: Fetching sessions...");
      const { data, error } = await supabase
        .from("rehearsal_sessions")
        .select(`
          *,
          songs (
            title,
            artist
          ),
          profiles:created_by (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("GroupRehearsal: Error fetching sessions:", error);
        throw error;
      }
      console.log("GroupRehearsal: Sessions fetched:", data?.length);
      setSessions(data || []);
    } catch (error: any) {
      console.error("GroupRehearsal: Catch block error:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!user) {
      console.error("GroupRehearsal: Cannot create session - no user");
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear una sesión",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("GroupRehearsal: Creating new session...");
      const now = new Date();
      const sessionName = `Ensayo - ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

      const { data, error } = await supabase
        .from("rehearsal_sessions")
        .insert({
          title: "Nueva Sesión de Ensayo",
          session_name: sessionName,
          description: "Sesión de ensayo colaborativo",
          group_id: "general",
          status: "draft",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("GroupRehearsal: Error creating session:", error);
        throw error;
      }

      console.log("GroupRehearsal: Session created successfully:", data.id);
      toast({
        title: "Sesión creada",
        description: "Se ha creado una nueva sesión de ensayo",
      });

      // Navigate to the new session
      navigate(`/rehearsals/${data.id}`);
    } catch (error: any) {
      console.error("GroupRehearsal: Catch block error:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la sesión",
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userProfile || userProfile.role !== 'administrator') {
      toast({
        title: "Error",
        description: "Solo los administradores pueden eliminar sesiones",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      // First delete all tracks associated with the session
      const { error: tracksError } = await supabase
        .from("rehearsal_tracks")
        .delete()
        .eq("session_id", sessionId);

      if (tracksError) {
        console.error("Error deleting tracks:", tracksError);
      }

      // Then delete all participants
      const { error: participantsError } = await supabase
        .from("rehearsal_participants")
        .delete()
        .eq("session_id", sessionId);

      if (participantsError) {
        console.error("Error deleting participants:", participantsError);
      }

      // Finally delete the session
      const { error } = await supabase
        .from("rehearsal_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      toast({
        title: "Sesión eliminada",
        description: "La sesión ha sido eliminada exitosamente",
      });

      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión",
        variant: "destructive",
      });
      console.error("Error deleting session:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Borrador", variant: "secondary" as const },
      in_progress: { label: "En Progreso", variant: "default" as const },
      completed: { label: "Completado", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Ensayos Colaborativos
              </h1>
              <p className="text-gray-600">
                Graba y mezcla tus pistas de ensayo en tiempo real
              </p>
            </div>
            <Button 
              onClick={createNewSession}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Sesión
            </Button>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="instrucciones">Instrucciones</TabsTrigger>
            <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
          </TabsList>

          <TabsContent value="sesiones" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando sesiones...</p>
              </div>
            ) : sessions.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Music2 className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay sesiones</h3>
                  <p className="text-gray-500 mb-4">Crea tu primera sesión de ensayo</p>
                  <Button onClick={createNewSession}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Sesión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/rehearsals/${session.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Music2 className="w-8 h-8 text-purple-600" />
                        <div className="flex items-center gap-2">
                          {getStatusBadge(session.status)}
                          {userProfile?.role === 'administrator' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => deleteSession(session.id, e)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-xl">
                        {session.session_name || session.title}
                      </CardTitle>
                      <CardDescription>
                        {session.songs?.title || "Sin canción asignada"}
                        {session.songs?.artist && ` - ${session.songs.artist}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Creado por {session.profiles?.full_name || 'Usuario'}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleString('es-ES')}
                        </p>
                        <Button className="w-full mt-4" variant="outline">
                          <Play className="w-4 h-4 mr-2" />
                          Abrir Sesión
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="instrucciones" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Para Voces */}
              <Card>
                <CardHeader>
                  <Mic className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Para Voces</CardTitle>
                  <CardDescription>Grupos de Aleida, Massy y Keyla</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Funciones:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Graba tu canal individual (Soprano, Alto, Tenor, Bajo)</li>
                      <li>Escucha todas las pistas sincronizadas</li>
                      <li>Controla el volumen de cada canal</li>
                      <li>Mezcla final automática</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Para Músicos */}
              <Card>
                <CardHeader>
                  <Headphones className="w-8 h-8 text-purple-600 mb-2" />
                  <CardTitle>Para Músicos</CardTitle>
                  <CardDescription>Instrumentos y acompañamiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Funciones:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Graba tu instrumento (Piano, Guitarra, Batería)</li>
                      <li>Sincroniza con pista base</li>
                      <li>Ajusta tempo y mezcla</li>
                      <li>Exporta tu contribución</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Para Danza */}
              <Card>
                <CardHeader>
                  <Video className="w-8 h-8 text-pink-600 mb-2" />
                  <CardTitle>Para Danza</CardTitle>
                  <CardDescription>Coreografía y sincronización</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Funciones:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Graba video de tu coreografía</li>
                      <li>Sincroniza con música</li>
                      <li>Ve todos los videos lado a lado</li>
                      <li>Comparte resultado final</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tutorial rápido */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>¿Cómo usar el módulo?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li><strong>Crea una sesión:</strong> Haz clic en "Nueva Sesión" y selecciona una canción</li>
                  <li><strong>Sube la pista base:</strong> Carga el MP3 de referencia (opcional)</li>
                  <li><strong>Graba tu parte:</strong> Selecciona tu tipo de voz/instrumento y graba</li>
                  <li><strong>Escucha el resultado:</strong> Reproduce todas las pistas juntas</li>
                  <li><strong>Ajusta y mezcla:</strong> Controla volúmenes y balance</li>
                  <li><strong>Comparte:</strong> Exporta y envía por WhatsApp</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupRehearsal;
