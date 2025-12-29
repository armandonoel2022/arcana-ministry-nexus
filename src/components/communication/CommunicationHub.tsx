import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FrequentContacts } from "./FrequentContacts";
import { ConversationList } from "./ConversationList";
import { ContactSelector } from "./ContactSelector";
import { DirectMessage } from "./DirectMessage";
import { ChatRoom } from "./ChatRoom";
import { ChatRoomAutoAdd } from "./ChatRoomAutoAdd";

type View = "list" | "room" | "direct" | "contacts";

interface Partner {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface RoomData {
  id: string;
  name: string;
  description?: string;
  room_type: string;
  is_moderated: boolean;
}

export const CommunicationHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"message" | "members">("message");
  const [view, setView] = useState<View>("list");
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    // Check for roomId in URL
    const roomIdFromUrl = searchParams.get("roomId");
    if (roomIdFromUrl && currentUser) {
      openRoomById(roomIdFromUrl);
    }
  }, [searchParams, currentUser]);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setCurrentUser({ ...user, profile });
      }
    } catch (error) {
      console.error("Error getting user:", error);
    } finally {
      setLoading(false);
    }
  };

  const openRoomById = async (roomId: string) => {
    try {
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (room) {
        setSelectedRoom({
          id: room.id,
          name: room.name,
          description: room.description || undefined,
          room_type: room.room_type,
          is_moderated: room.is_moderated || false,
        });
        setView("room");
        setSearchParams({});
      }
    } catch (error) {
      console.error("Error opening room:", error);
    }
  };

  const handleSelectRoom = (room: RoomData) => {
    setSelectedRoom(room);
    setView("room");
  };

  const handleSelectDirect = (partner: Partner) => {
    setSelectedPartner(partner);
    setView("direct");
  };

  const handleSelectContact = (contact: Partner) => {
    setSelectedPartner(contact);
    setView("direct");
  };

  const handleShowAllContacts = () => {
    setView("contacts");
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para unirte",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("chat_room_members").upsert({
        room_id: roomId,
        user_id: currentUser.id,
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Te has unido a la sala",
      });

      // Refresh and open the room
      openRoomById(roomId);
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Error",
        description: "No se pudo unir a la sala",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setView("list");
    setSelectedRoom(null);
    setSelectedPartner(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Inicia sesión para acceder al chat</p>
      </div>
    );
  }

  // View: Room chat
  if (view === "room" && selectedRoom) {
    return (
      <ChatRoom 
        room={selectedRoom} 
        onBack={handleBack}
        onStartDirectChat={(partner) => {
          setSelectedPartner(partner);
          setView("direct");
        }}
      />
    );
  }

  // View: Direct message
  if (view === "direct" && selectedPartner) {
    return (
      <DirectMessage
        partner={selectedPartner}
        currentUserId={currentUser.id}
        onBack={handleBack}
      />
    );
  }

  // View: Contact selector
  if (view === "contacts") {
    return (
      <ContactSelector
        currentUserId={currentUser.id}
        onSelectContact={handleSelectContact}
        onBack={handleBack}
      />
    );
  }

  // Main view: Conversation list
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Auto-add to general room */}
      <ChatRoomAutoAdd />

      {/* Header */}
      <div className="bg-primary px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Mensajes ARCANA</h1>
            <p className="text-primary-foreground/70 text-sm">Comunicación del ministerio</p>
          </div>
        </div>
      </div>

      {/* Tab switcher and search */}
      <div className="bg-primary/90 px-4 py-3 space-y-3">
        {/* Tabs */}
        <div className="flex items-center justify-center gap-2">
          <Search className="w-5 h-5 text-primary-foreground/70" />
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
            <TabsList className="bg-primary-foreground/10 p-1">
              <TabsTrigger
                value="message"
                className="text-primary-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-full px-6"
              >
                Mensajes
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="text-primary-foreground data-[state=active]:bg-background data-[state=active]:text-foreground rounded-full px-6"
              >
                Miembros
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Frequent contacts row */}
      <div className="bg-primary/80 border-b border-primary/20">
        <FrequentContacts
          currentUserId={currentUser.id}
          onSelectContact={handleSelectContact}
          onShowAllContacts={handleShowAllContacts}
        />
      </div>

      {/* Search bar */}
      <div className="p-3 border-b bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="pl-10 bg-muted border-0 rounded-full"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList
          currentUserId={currentUser.id}
          searchTerm={searchTerm}
          onSelectRoom={handleSelectRoom}
          onSelectDirect={handleSelectDirect}
          onJoinRoom={handleJoinRoom}
        />
      </div>
    </div>
  );
};
