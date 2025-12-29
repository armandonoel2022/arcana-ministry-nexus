import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Users, MessageCircle, LogOut, Crown, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoomMember {
  id: string;
  full_name: string;
  photo_url: string | null;
  email?: string | null;
  role: string;
  isCurrentUser: boolean;
}

interface RoomMembersPanelProps {
  roomId: string;
  roomName: string;
  currentUserId: string;
  onStartChat: (member: { id: string; full_name: string; photo_url: string | null }) => void;
  onLeaveRoom?: () => void;
}

export const RoomMembersPanel = ({ 
  roomId, 
  roomName, 
  currentUserId, 
  onStartChat,
  onLeaveRoom 
}: RoomMembersPanelProps) => {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, roomId]);

  const fetchMembers = async () => {
    try {
      // Obtener miembros de la sala
      const { data: roomMembers } = await supabase
        .from("chat_room_members")
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            full_name,
            photo_url,
            email
          )
        `)
        .eq("room_id", roomId);

      // Obtener fotos de members
      const { data: allMembers } = await supabase
        .from("members")
        .select("email, photo_url, nombres, apellidos")
        .eq("is_active", true);

      const mappedMembers: RoomMember[] = (roomMembers || [])
        .filter(rm => rm.profiles)
        .map(rm => {
          const profile = rm.profiles as any;
          let photoUrl = profile.photo_url;

          // Buscar foto en members si no tiene en profiles
          if (!photoUrl && allMembers) {
            const member = allMembers.find(m => 
              (m.email && profile.email && m.email.toLowerCase() === profile.email.toLowerCase()) ||
              (profile.full_name && m.nombres && profile.full_name.toLowerCase().includes(m.nombres.toLowerCase()))
            );
            if (member?.photo_url) {
              photoUrl = member.photo_url;
            }
          }

          return {
            id: profile.id,
            full_name: profile.full_name,
            photo_url: photoUrl,
            email: profile.email,
            role: rm.role || "member",
            isCurrentUser: profile.id === currentUserId
          };
        });

      // Ordenar: moderadores primero, luego por nombre
      mappedMembers.sort((a, b) => {
        if (a.role === "moderator" && b.role !== "moderator") return -1;
        if (b.role === "moderator" && a.role !== "moderator") return 1;
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching room members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (leaving) return;
    
    setLeaving(true);
    try {
      const { error } = await supabase
        .from("chat_room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast({
        title: "Has salido de la sala",
        description: `Ya no eres miembro de ${roomName}`,
      });

      setIsOpen(false);
      onLeaveRoom?.();
    } catch (error) {
      console.error("Error leaving room:", error);
      toast({
        title: "Error",
        description: "No se pudo salir de la sala",
        variant: "destructive",
      });
    } finally {
      setLeaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "moderator":
        return <Crown className="w-3 h-3 text-amber-500" />;
      case "admin":
        return <Shield className="w-3 h-3 text-primary" />;
      default:
        return null;
    }
  };

  // Colores para los bordes de avatares
  const borderColors = [
    "ring-emerald-400",
    "ring-amber-400",
    "ring-pink-400",
    "ring-sky-400",
    "ring-violet-400",
    "ring-rose-400",
    "ring-teal-400",
    "ring-orange-400"
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Users className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-4 border-b bg-primary">
          <SheetTitle className="text-primary-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Miembros ({members.length})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 ${
                    member.isCurrentUser ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <Avatar className={`w-12 h-12 ring-2 ${borderColors[index % borderColors.length]} ring-offset-2 ring-offset-background`}>
                    <AvatarImage src={member.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-sm font-medium">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground truncate">
                        {member.full_name}
                      </span>
                      {getRoleIcon(member.role)}
                      {member.isCurrentUser && (
                        <span className="text-xs text-muted-foreground">(Tú)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role === "moderator" ? "Moderador" : 
                       member.role === "admin" ? "Admin" : "Miembro"}
                    </p>
                  </div>

                  {!member.isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-primary hover:bg-primary/10"
                      onClick={() => {
                        onStartChat({
                          id: member.id,
                          full_name: member.full_name,
                          photo_url: member.photo_url
                        });
                        setIsOpen(false);
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Leave room button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLeaveRoom}
            disabled={leaving}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {leaving ? "Saliendo..." : "Salir de la sala"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};