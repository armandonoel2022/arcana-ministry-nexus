
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Lock, Globe } from "lucide-react";
import { ChatRoom } from "./ChatRoom";
import { useToast } from "@/hooks/use-toast";

interface ChatRoomData {
  id: string;
  name: string;
  description?: string;
  room_type: string;
  department?: string;
  is_moderated: boolean;
  is_active: boolean;
  member_count?: number;
}

export const ChatRooms = () => {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_room_members(count)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const roomsWithCount = data?.map(room => ({
        ...room,
        member_count: room.chat_room_members?.length || 0
      })) || [];

      setRooms(roomsWithCount);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las salas de chat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para unirte a una sala",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('chat_room_members')
        .upsert({
          room_id: roomId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Te has unido a la sala de chat"
      });

      fetchRooms();
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "No se pudo unir a la sala",
        variant: "destructive"
      });
    }
  };

  if (selectedRoom) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setSelectedRoom(null)}
          className="mb-4"
        >
          ← Volver a salas
        </Button>
        <ChatRoom room={selectedRoom} />
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Cargando salas...</div>;
  }

  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay salas de chat disponibles
        </div>
      ) : (
        rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-arcana-blue-gradient rounded-full flex items-center justify-center">
                    {room.room_type === 'general' ? (
                      <Globe className="w-5 h-5 text-white" />
                    ) : (
                      <Users className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    {room.description && (
                      <p className="text-sm text-gray-600">{room.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {room.is_moderated && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Moderado
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {room.member_count} miembros
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={room.room_type === 'general' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {room.room_type === 'general' ? 'General' : 'Departamento'}
                  </Badge>
                  {room.department && (
                    <span className="text-sm text-gray-500">{room.department}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => joinRoom(room.id)}
                  >
                    Unirse
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedRoom(room)}
                    className="bg-arcana-blue-gradient hover:opacity-90"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Abrir Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
