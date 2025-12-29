import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RoomMember {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface RoomMembersRowProps {
  roomId: string;
  currentUserId: string;
  onSelectMember: (member: RoomMember) => void;
}

export const RoomMembersRow = ({ roomId, currentUserId, onSelectMember }: RoomMembersRowProps) => {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [roomId]);

  const fetchMembers = async () => {
    try {
      // Obtener miembros de la sala
      const { data: roomMembers } = await supabase
        .from("chat_room_members")
        .select(`
          user_id,
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
        .filter(rm => rm.profiles && (rm.profiles as any).id !== currentUserId)
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
            photo_url: photoUrl
          };
        });

      // Ordenar por nombre
      mappedMembers.sort((a, b) => a.full_name.localeCompare(b.full_name));

      setMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching room members:", error);
    } finally {
      setLoading(false);
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

  // Colores para los bordes
  const borderColors = [
    "ring-emerald-400",
    "ring-amber-400",
    "ring-pink-400",
    "ring-sky-400",
    "ring-violet-400",
    "ring-rose-400",
    "ring-teal-400",
    "ring-orange-400",
    "ring-cyan-400",
    "ring-lime-400"
  ];

  if (loading) {
    return (
      <div className="flex gap-3 px-3 py-2 overflow-x-auto bg-primary/10">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[50px]">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="w-8 h-2 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 px-3 py-2 overflow-x-auto scrollbar-hide bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b">
      {members.map((member, index) => (
        <button
          key={member.id}
          onClick={() => onSelectMember(member)}
          className="flex flex-col items-center gap-1 min-w-[50px] group"
        >
          <Avatar 
            className={`w-10 h-10 ring-2 ${borderColors[index % borderColors.length]} ring-offset-1 ring-offset-background group-hover:scale-110 transition-transform shadow-sm`}
          >
            <AvatarImage 
              src={member.photo_url || undefined} 
              alt={member.full_name} 
              className="object-cover" 
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/50 text-xs font-medium text-primary-foreground">
              {getInitials(member.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground truncate w-12 text-center group-hover:text-foreground transition-colors">
            {member.full_name.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
};