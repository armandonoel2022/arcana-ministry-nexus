import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Radio, 
  Play, 
  Pause, 
  Plus,
  Music,
  Users,
  Video,
  Mic,
  Volume2,
  VolumeX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RehearsalSession {
  id: string;
  title: string;
  description: string | null;
  group_id: string;
  song_id: string | null;
  backing_track_url: string | null;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  songs?: {
    title: string;
    artist: string | null;
  } | null;
}

const GroupRehearsal = () => {
  const [sessions, setSessions] = useState<RehearsalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGroup, setUserGroup] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserGroup();
  }, []);

  useEffect(() => {
    if (userGroup) {
      fetchSessions();
    }
  }, [userGroup]);

  const fetchUserGroup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener el grupo del usuario desde su perfil o tabla de grupos
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Por ahora establecemos un grupo por defecto
      // TODO: Implementar lógica para determinar el grupo del usuario
      setUserGroup('grupo_massy');
    } catch (error) {
      console.error('Error fetching user group:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar tu grupo",
        variant: "destructive"
      });
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rehearsal_sessions')
        .select(`
          *,
          songs (
            title,
            artist
          )
        `)
        .eq('group_id', userGroup)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones de ensayo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getGroupName = (groupId: string) => {
    const groups: Record<string, string> = {
      'grupo_massy': 'Grupo Massy',
      'grupo_aleida': 'Grupo Aleida',
      'grupo_keyla': 'Grupo Keyla',
      'musicos': 'Músicos',
      'danza': 'Danza'
    };
    return groups[groupId] || groupId;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-500',
      'in_progress': 'bg-blue-500',
      'completed': 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Borrador',
      'in_progress': 'En Progreso',
      'completed': 'Completado'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ensayos Colaborativos</h1>
              <p className="text-gray-600">
                {userGroup ? getGroupName(userGroup) : 'Cargando...'}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Sesiones
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Sesión
            </TabsTrigger>
          </TabsList>

          {/* Tab de Sesiones */}
          <TabsContent value="sessions" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Cargando sesiones...</p>
                </CardContent>
              </Card>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay sesiones de ensayo
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Crea tu primera sesión para comenzar a ensayar
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Sesión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Music className="w-8 h-8 text-blue-500" />
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusLabel(session.status)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      {session.songs && (
                        <CardDescription>
                          {session.songs.title}
                          {session.songs.artist && ` - ${session.songs.artist}`}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {session.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {session.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Play className="w-4 h-4 mr-1" />
                          Abrir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab de Crear Nueva Sesión */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Sesión de Ensayo</CardTitle>
                <CardDescription>
                  Configura una nueva sesión para tu grupo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Funcionalidad en desarrollo...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Próximamente podrás crear sesiones, grabar pistas individuales y sincronizar tu audio/video con el grupo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <Mic className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold mb-1">Grabación Multi-canal</h3>
              <p className="text-sm opacity-90">
                Graba tu voz o instrumento por separado
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <Volume2 className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold mb-1">Mezcla Personalizada</h3>
              <p className="text-sm opacity-90">
                Ajusta volumen y escucha cada pista
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <Video className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold mb-1">Sincronización de Video</h3>
              <p className="text-sm opacity-90">
                Para grupos de danza
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GroupRehearsal;
