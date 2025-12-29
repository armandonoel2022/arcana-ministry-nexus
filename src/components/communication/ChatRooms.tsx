import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Globe, Search } from "lucide-react";
import { ChatRoom } from "./ChatRoom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface ChatRoomData {
  id: string;
  name: string;
  description?: string;
  room_type: string;
  is_moderated: boolean;
  is_active: boolean;
  member_count?: number;
  is_member?: boolean;
}

export const ChatRooms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchRooms();
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchRooms = async () => {
    try {
      // Get all active rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("is_active", true);

      if (roomsError) throw roomsError;

      // Get member counts
      const { data: memberCounts } = await supabase.from("chat_room_members").select("room_id");

      const memberCountMap =
        memberCounts?.reduce(
          (acc, member) => {
            acc[member.room_id] = (acc[member.room_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      // Check current user membership
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let userMemberships: string[] = [];

      if (user) {
        const { data: userMemberData } = await supabase
          .from("chat_room_members")
          .select("room_id")
          .eq("user_id", user.id);

        userMemberships = userMemberData?.map((m) => m.room_id) || [];
      }

      // Combine data
      const roomsWithCount =
        roomsData?.map((room) => ({
          ...room,
          member_count: memberCountMap[room.id] || 0,
          is_member: userMemberships.includes(room.id),
        })) || [];

      setRooms(roomsWithCount);

      // Check if there's a room ID in URL params
      const roomIdFromUrl = searchParams.get('room');
      if (roomIdFromUrl && roomsWithCount.length > 0) {
        const roomToOpen = roomsWithCount.find(r => r.id === roomIdFromUrl);
        if (roomToOpen && roomToOpen.is_member) {
          setSelectedRoom(roomToOpen);
          // Clear the URL param after opening
          setSearchParams({});
        }
      }
    } catch (error) {
      console.error("Error in fetchRooms:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las salas de chat",
        variant: "destructive",
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
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("chat_room_members").upsert({
        room_id: roomId,
        user_id: currentUser.id,
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Te has unido a la sala de chat",
      });

      fetchRooms();
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Error",
        description: "No se pudo unir a la sala",
        variant: "destructive",
      });
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Si hay una sala seleccionada, mostrar el chat
  if (selectedRoom) {
    return <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white h-screen">
      {/* Barra de búsqueda */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-100 border-0 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="overflow-y-auto h-[calc(100vh-140px)]">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No se encontraron conversaciones" : "No hay salas de chat disponibles"}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => room.is_member && setSelectedRoom(room)}
            >
              {/* Avatar del chat */}
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                {room.room_type === "general" ? (
                  <Globe className="w-6 h-6 text-white" />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Contenido del chat */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {room.member_count} miembros
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {room.is_member ? (
                      room.description || "Toca para abrir el chat"
                    ) : (
                      <span className="text-blue-600">Toca para unirte</span>
                    )}
                  </p>

                  {!room.is_member && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        joinRoom(room.id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 px-2"
                    >
                      Unirse
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
