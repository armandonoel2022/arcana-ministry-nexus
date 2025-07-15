
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
  is_member?: boolean;
}

export const ChatRooms = () => {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchRooms();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchRooms = async () => {
    try {
      console.log("Fetching chat rooms...");
      
      // Get all active rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log("Rooms data:", roomsData);

      // Get member counts for each room
      const { data: memberCounts, error: membersError } = await supabase
        .from('chat_room_members')
        .select('room_id');

      if (membersError) {
        console.error('Error fetching member counts:', membersError);
        throw membersError;
      }

      console.log("Member counts data:", memberCounts);

      // Count members per room
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.room_id] = (acc[member.room_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Check current user membership
      const { data: { user } } = await supabase.auth.getUser();
      let userMemberships: string[] = [];
      
      if (user) {
        const { data: userMemberData, error: userMemberError } = await supabase
          .from('chat_room_members')
          .select('room_id')
          .eq('user_id', user.id);

        if (userMemberError) {
          console.error('Error fetching user memberships:', userMemberError);
        } else {
          userMemberships = userMemberData?.map(m => m.room_id) || [];
        }
      }

      // Combine data
      const roomsWithCount = roomsData?.map(room => ({
        ...room,
        member_count: memberCountMap[room.id] || 0,
        is_member: userMemberships.includes(room.id)
      })) || [];

      console.log("Final rooms data:", roomsWithCount);
      setRooms(roomsWithCount);
      
      // Seleccionar automáticamente la sala principal si no hay una sala seleccionada
      if (!selectedRoom && roomsWithCount.length > 0) {
        const mainRoom = roomsWithCount.find(r => r.room_type === 'general') || roomsWithCount[0];
        setSelectedRoom(mainRoom);
      }
    } catch (error) {
      console.error('Error in fetchRooms:', error);
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
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para unirte a una sala",
          variant: "destructive"
        });
        return;
      }

      console.log("Joining room:", roomId, "User:", currentUser.id);

      const { error } = await supabase
        .from('chat_room_members')
        .upsert({
          room_id: roomId,
          user_id: currentUser.id
        });

      if (error) {
        console.error('Error joining room:', error);
        throw error;
      }

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
                  {room.is_member && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      Miembro
                    </Badge>
                  )}
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
                  {!room.is_member && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => joinRoom(room.id)}
                    >
                      Unirse
                    </Button>
                  )}
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
