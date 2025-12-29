import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Conversation {
  id: string;
  type: "room" | "direct";
  name: string;
  photo_url?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  member_count?: number;
  is_member?: boolean;
  room_type?: string;
  partner_id?: string;
}

interface ConversationListProps {
  currentUserId: string;
  searchTerm: string;
  onSelectRoom: (room: any) => void;
  onSelectDirect: (partner: any) => void;
  onJoinRoom: (roomId: string) => void;
}

export const ConversationList = ({
  currentUserId,
  searchTerm,
  onSelectRoom,
  onSelectDirect,
  onJoinRoom,
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Refrescar cada 30s
    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      // Obtener salas de chat
      const { data: roomsData } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("is_active", true);

      const { data: memberCounts } = await supabase
        .from("chat_room_members")
        .select("room_id");

      const { data: userMemberData } = await supabase
        .from("chat_room_members")
        .select("room_id")
        .eq("user_id", currentUserId);

      const memberCountMap = memberCounts?.reduce((acc, m) => {
        acc[m.room_id] = (acc[m.room_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userMemberships = userMemberData?.map(m => m.room_id) || [];

      // Obtener último mensaje de cada sala
      const roomConversations: Conversation[] = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("message, created_at")
            .eq("room_id", room.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            id: room.id,
            type: "room" as const,
            name: room.name,
            last_message: lastMsg?.message,
            last_message_at: lastMsg?.created_at,
            unread_count: 0, // TODO: implementar conteo de no leídos
            member_count: memberCountMap[room.id] || 0,
            is_member: userMemberships.includes(room.id),
            room_type: room.room_type,
          };
        })
      );

      // Obtener conversaciones directas
      const { data: directMsgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      // Agrupar por partner
      const partnerMap = new Map<string, { message: string; created_at: string; unread: number }>();
      
      directMsgs?.forEach(msg => {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            message: msg.message,
            created_at: msg.created_at,
            unread: 0
          });
        }
        if (msg.receiver_id === currentUserId && !msg.is_read) {
          const existing = partnerMap.get(partnerId)!;
          existing.unread++;
        }
      });

      // Obtener info de los partners
      const partnerIds = Array.from(partnerMap.keys());
      let directConversations: Conversation[] = [];

      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, photo_url")
          .in("id", partnerIds);

        directConversations = (profiles || []).map(profile => {
          const msgInfo = partnerMap.get(profile.id)!;
          return {
            id: `dm-${profile.id}`,
            type: "direct" as const,
            name: profile.full_name,
            photo_url: profile.photo_url,
            partner_id: profile.id,
            last_message: msgInfo.message,
            last_message_at: msgInfo.created_at,
            unread_count: msgInfo.unread,
          };
        });
      }

      // Combinar y ordenar por último mensaje
      const allConversations = [...roomConversations, ...directConversations]
        .sort((a, b) => {
          if (!a.last_message_at) return 1;
          if (!b.last_message_at) return -1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

      setConversations(allConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: false, locale: es });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filteredConversations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No se encontraron conversaciones" : "No hay conversaciones aún"}
        </div>
      ) : (
        filteredConversations.map(conv => (
          <div
            key={conv.id}
            className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors active:bg-muted"
            onClick={() => {
              if (conv.type === "room") {
                if (conv.is_member) {
                  onSelectRoom({
                    id: conv.id,
                    name: conv.name,
                    room_type: conv.room_type,
                    is_moderated: false,
                  });
                } else {
                  onJoinRoom(conv.id);
                }
              } else if (conv.partner_id) {
                onSelectDirect({
                  id: conv.partner_id,
                  full_name: conv.name,
                  photo_url: conv.photo_url,
                });
              }
            }}
          >
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-12 h-12">
                {conv.type === "room" ? (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {conv.room_type === "general" ? (
                      <Globe className="w-5 h-5" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={conv.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                      {getInitials(conv.name)}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              {conv.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-destructive-foreground">
                    {conv.unread_count > 9 ? "9+" : conv.unread_count}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-semibold text-foreground truncate">{conv.name}</h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {conv.type === "room" && !conv.is_member ? (
                    <span className="text-primary">Toca para unirte</span>
                  ) : (
                    conv.last_message || (conv.type === "room" ? "Sin mensajes" : "Inicia la conversación")
                  )}
                </p>
                {conv.type === "room" && (
                  <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
                    {conv.member_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
