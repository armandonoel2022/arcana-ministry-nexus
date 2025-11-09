import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronUp, Mic, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupMember {
  id: string;
  user_id: string;
  instrument: string;
  is_leader: boolean;
  notes: string | null;
  mic_order: number | null;
  member: {
    id: string;
    nombres: string;
    apellidos: string;
    photo_url: string | null;
    voz_instrumento: string | null;
    cargo: string;
  } | null;
}

interface GroupMembersDisplayProps {
  groupId: string;
  groupName: string;
  onCollapse: () => void;
}

const GroupMembersDisplay: React.FC<GroupMembersDisplayProps> = ({ groupId, groupName, onCollapse }) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      console.log("=== DEBUG: Fetching members for group ===", groupId);

      const { data, error } = await supabase
        .from("group_members")
        .select(
          `
          id,
          user_id,
          instrument,
          is_leader,
          notes,
          mic_order,
          members!group_members_user_id_fkey (
            id,
            nombres,
            apellidos,
            photo_url,
            voz_instrumento,
            cargo
          )
        `,
        )
        .eq("group_id", groupId)
        .eq("is_active", true)
        .order("mic_order", { ascending: true, nullsFirst: false })
        .order("is_leader", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("=== DEBUG: Raw data from Supabase ===", data);

      // Mejorar el filtrado de miembros
      const validMembers = (data || [])
        .filter((item) => {
          if (!item.members) {
            console.log("Member data missing for group member:", item.id);
            return false;
          }

          // Si members es un array, verificar que tenga elementos válidos
          if (Array.isArray(item.members)) {
            const isValid = item.members.length > 0 && item.members[0] !== null;
            if (!isValid) {
              console.log("Invalid array member data for:", item.id);
            }
            return isValid;
          }

          // Si es un objeto, verificar que tenga datos esenciales
          const isValid = item.members.id !== null && item.members.id !== undefined;
          if (!isValid) {
            console.log("Invalid object member data for:", item.id);
          }
          return isValid;
        })
        .map((item) => ({
          ...item,
          member: Array.isArray(item.members) ? item.members[0] : item.members,
        }));

      console.log("=== DEBUG: Valid members count ===", validMembers.length);
      console.log("=== DEBUG: Valid members ===", validMembers);

      setMembers(validMembers);
    } catch (error) {
      console.error("Error fetching group members:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupMembers();
    }
  }, [groupId]);

  // Función para asignar números de micrófono basado en mic_order o índice
  const getMicrophoneNumber = (member: GroupMember, index: number) => {
    if (member.mic_order !== null && member.mic_order !== undefined) {
      return `Micrófono #${member.mic_order}`;
    }
    return `Micrófono #${index + 1}`;
  };

  // Función para obtener las iniciales del nombre
  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  // Función para obtener el texto del instrumento/voz
  const getInstrumentText = (member: GroupMember) => {
    if (member.member?.voz_instrumento) {
      return member.member.voz_instrumento;
    }
    // Mapear valores enum a texto legible
    const instrumentMap: Record<string, string> = {
      vocals: "Voz",
      piano: "Piano",
      guitar: "Guitarra",
      bass: "Bajo",
      drums: "Batería",
      other: "Instrumento",
    };
    return instrumentMap[member.instrument] || member.instrument || "Corista";
  };

  // Función para obtener el cargo del miembro
  const getRoleText = (member: GroupMember) => {
    if (member.is_leader) {
      return "Director de Alabanza";
    }

    const cargo = member.member?.cargo;
    switch (cargo) {
      case "directora_alabanza":
        return "Directora de Alabanza";
      case "director_alabanza":
        return "Director de Alabanza";
      case "corista":
        return "Corista";
      case "musico":
        return "Músico";
      default:
        return cargo || "Miembro";
    }
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Miembros de {groupName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCollapse}>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Miembros de {groupName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCollapse}>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay miembros asignados a este grupo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Miembros de {groupName} ({members.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCollapse}>
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, index) => {
            if (!member.member) return null;

            return (
              <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={member.member.photo_url || undefined}
                      alt={`${member.member.nombres} ${member.member.apellidos}`}
                    />
                    <AvatarFallback className="text-lg font-semibold">
                      {getInitials(member.member.nombres, member.member.apellidos)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                      {member.member.nombres} {member.member.apellidos}
                    </h3>

                    <p className="text-sm text-gray-600">{getInstrumentText(member)}</p>

                    <Badge variant={member.is_leader ? "default" : "secondary"} className="text-xs">
                      {getRoleText(member)}
                    </Badge>

                    <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                      <Mic className="w-3 h-3" />
                      <span>{getMicrophoneNumber(member, index)}</span>
                    </div>

                    {member.notes && <p className="text-xs text-gray-500 mt-2">{member.notes}</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMembersDisplay;
