import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Crown, LogOut, MessageCircle, Shield, Users } from "lucide-react";

interface RoomMember {
  id: string;
  full_name: string;
  photo_url: string | null;
  role: string;
  isCurrentUser: boolean;
}

interface RoomMembersPanelProps {
  roomId: string;
  roomName: string;
  roomType?: string;
  currentUserId: string;
  onStartChat: (member: { id: string; full_name: string; photo_url: string | null }) => void;
  onLeaveRoom?: () => void;
}

export const RoomMembersPanel = ({
  roomId,
  roomName,
  roomType,
  currentUserId,
  onStartChat,
  onLeaveRoom,
}: RoomMembersPanelProps) => {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { toast } = useToast();

  const isGeneralRoom = roomType === "general" || roomName?.toLowerCase().includes("general");

  useEffect(() => {
    if (isOpen) fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roomId, roomType, roomName, currentUserId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: allMembers } = await supabase
        .from("members")
        .select("email, photo_url, nombres, apellidos")
        .eq("is_active", true);

      // Sala general: lista de usuarios activos (registrados)
      if (isGeneralRoom) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, photo_url, email")
          .eq("is_active", true)
          .order("full_name");

        const mapped = (profiles || []).map((p) => {
          let photoUrl = p.photo_url;
          if (!photoUrl && allMembers) {
            const m = allMembers.find(
              (mm) =>
                (mm.email && p.email && mm.email.toLowerCase() === p.email.toLowerCase()) ||
                (p.full_name && mm.nombres && p.full_name.toLowerCase().includes(mm.nombres.toLowerCase())),
            );
            if (m?.photo_url) photoUrl = m.photo_url;
          }
          return {
            id: p.id,
            full_name: p.full_name,
            photo_url: photoUrl,
            role: p.id === currentUserId ? "you" : "member",
            isCurrentUser: p.id === currentUserId,
          };
        });

        setMembers(mapped);
        return;
      }

      // Otras salas: usar chat_room_members (sin join por FK)
      const { data: roomMembers, error: rmError } = await supabase
        .from("chat_room_members")
        .select("user_id, role")
        .eq("room_id", roomId);

      if (rmError) throw rmError;

      const membershipMap = new Map<string, string>();
      (roomMembers || []).forEach((rm) => {
        if (rm.user_id) membershipMap.set(rm.user_id, rm.role || "member");
      });

      const ids = Array.from(membershipMap.keys());
      if (ids.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, email")
        .in("id", ids);

      if (pError) throw pError;

      const mapped: RoomMember[] = (profiles || []).map((p) => {
        let photoUrl = p.photo_url;
        if (!photoUrl && allMembers) {
          const m = allMembers.find(
            (mm) =>
              (mm.email && p.email && mm.email.toLowerCase() === p.email.toLowerCase()) ||
              (p.full_name && mm.nombres && p.full_name.toLowerCase().includes(mm.nombres.toLowerCase())),
          );
          if (m?.photo_url) photoUrl = m.photo_url;
        }
        const role = membershipMap.get(p.id) || "member";
        return {
          id: p.id,
          full_name: p.full_name,
          photo_url: photoUrl,
          role,
          isCurrentUser: p.id === currentUserId,
        };
      });

      mapped.sort((a, b) => {
        const rank = (r: string) => (r === "moderator" ? 0 : r === "admin" ? 1 : 2);
        const d = rank(a.role) - rank(b.role);
        if (d !== 0) return d;
        return a.full_name.localeCompare(b.full_name);
      });

      setMembers(mapped);
    } catch (error) {
      console.error("Error fetching room members:", error);
      setMembers([]);
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
      toast({ title: "Error", description: "No se pudo salir de la sala", variant: "destructive" });
    } finally {
      setLeaving(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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

  const borderColors = [
    "ring-emerald-400",
    "ring-amber-400",
    "ring-pink-400",
    "ring-sky-400",
    "ring-violet-400",
    "ring-rose-400",
    "ring-teal-400",
    "ring-orange-400",
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
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

        <ScrollArea className="h-[calc(100dvh-140px)]">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
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
                  className={`flex items-center gap-3 p-3 ${member.isCurrentUser ? "bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <Avatar
                    className={`w-12 h-12 ring-2 ${
                      borderColors[index % borderColors.length]
                    } ring-offset-2 ring-offset-background`}
                  >
                    <AvatarImage src={member.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-sm font-medium">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground truncate">{member.full_name}</span>
                      {getRoleIcon(member.role)}
                      {member.isCurrentUser && <span className="text-xs text-muted-foreground">(Tú)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role === "moderator" ? "Moderador" : member.role === "admin" ? "Admin" : "Miembro"}
                    </p>
                  </div>

                  {!member.isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-primary hover:bg-primary/10"
                      onClick={() => {
                        onStartChat({ id: member.id, full_name: member.full_name, photo_url: member.photo_url });
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button variant="destructive" className="w-full" onClick={handleLeaveRoom} disabled={leaving}>
            <LogOut className="w-4 h-4 mr-2" />
            {leaving ? "Saliendo..." : "Salir de la sala"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
