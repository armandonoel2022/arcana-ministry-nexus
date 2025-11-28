import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Lock, Globe, Search, MoreVertical } from "lucide-react";
import { ChatRoom } from "./ChatRoom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export const ChatRooms = () => {
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
      console.log("Fetching chat rooms...");

      // Get all active rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("is_active", true);

      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        throw roomsError;
      }

      // Get member counts for each room
      const { data: memberCounts, error: membersError } = await supabase.from("chat_room_members").select("room_id");

      if (membersError) {
        console.error("Error fetching member counts:", membersError);
        throw membersError;
      }

      // Count members per room
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
        const { data: userMemberData, error: userMemberError } = await supabase
          .from("chat_room_members")
          .select("room_id")
          .eq("user_id", user.id);

        if (userMemberError) {
          console.error("Error fetching user memberships:", userMemberError);
        } else {
          userMemberships = userMemberData?.map((m) => m.room_id) || [];
        }
      }

      // Get last messages for each room
      const { data: lastMessages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("room_id, content, created_at")
        .order("created_at", { ascending: false });

      const lastMessageMap: Record<string, { content: string; created_at: string }> = {};
      lastMessages?.forEach((msg) => {
        if (!lastMessageMap[msg.room_id]) {
          lastMessageMap[msg.room_id] = {
            content: msg.content,
            created_at: msg.created_at,
          };
        }
      });

      // Combine data
      const roomsWithCount =
        roomsData?.map((room) => ({
          ...room,
          member_count: memberCountMap[room.id] || 0,
          is_member: userMemberships.includes(room.id),
          last_message: lastMessageMap[room.id]?.content,
          last_message_time: lastMessageMap[room.id]?.created_at,
          unread_count: 0, // Podrías implementar un contador de mensajes no leídos
        })) || [];

      console.log("Final rooms data:", roomsWithCount);
      setRooms(roomsWithCount);

      // Seleccionar automáticamente la sala principal si no hay una sala seleccionada
      if (!selectedRoom && roomsWithCount.length > 0) {
        const mainRoom = roomsWithCount.find((r) => r.room_type === "general") || roomsWithCount[0];
        setSelectedRoom(mainRoom);
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

      console.log("Joining room:", roomId, "User:", currentUser.id);

      const { error } = await supabase.from("chat_room_members").upsert({
        room_id: roomId,
        user_id: currentUser.id,
      });

      if (error) {
        console.error("Error joining room:", error);
        throw error;
      }

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Ayer";
    } else {
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (selectedRoom) {
    return (
      <div className="h-screen flex flex-col">
        <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcana-blue-600"></div>
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
              <div className="flex-shrink-0 w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center mr-3">
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
                  {room.last_message_time && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(room.last_message_time)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {room.is_member ? (
                      room.last_message || "No hay mensajes aún"
                    ) : (
                      <span className="text-arcana-blue-600">Toca para unirte</span>
                    )}
                  </p>

                  <div className="flex items-center gap-1 ml-2">
                    {room.unread_count > 0 && (
                      <Badge className="bg-arcana-blue-600 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                        {room.unread_count}
                      </Badge>
                    )}
                    {!room.is_member && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinRoom(room.id);
                        }}
                        className="bg-arcana-blue-gradient hover:opacity-90 text-white text-xs h-6 px-2"
                      >
                        Unirse
                      </Button>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{room.member_count} miembros</span>
                  {room.is_moderated && <Lock className="w-3 h-3 text-gray-400" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
