import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  photo_url?: string;
  role: string;
}

interface InviteParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  currentGroupId: string;
  onInviteSent: () => void;
}

const InviteParticipantDialog = ({
  open,
  onOpenChange,
  sessionId,
  currentGroupId,
  onInviteSent,
}: InviteParticipantDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchExistingParticipants();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = profiles.filter(p =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, role")
        .eq("is_approved", true)
        .eq("is_active", true)
        .neq("id", user?.id);

      if (error) throw error;
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("rehearsal_participants")
        .select("user_id")
        .eq("session_id", sessionId);

      if (error) throw error;
      
      const existingIds = new Set(data?.map(p => p.user_id) || []);
      setInvitedIds(existingIds);
    } catch (error: any) {
      console.error("Error fetching participants:", error);
    }
  };

  const inviteParticipant = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from("rehearsal_participants")
        .insert({
          session_id: sessionId,
          user_id: profileId,
          role: 'participant',
          invited_by: user?.id,
          invitation_status: 'accepted', // Auto-accept for now
        });

      if (error) throw error;

      setInvitedIds(new Set([...invitedIds, profileId]));

      toast({
        title: "Invitación enviada",
        description: "El participante ha sido agregado a la sesión",
      });

      onInviteSent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación",
        variant: "destructive",
      });
      console.error("Error inviting participant:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invitar Participantes</DialogTitle>
          <DialogDescription>
            Busca e invita miembros a colaborar en esta sesión
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Cargando...</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              {searchQuery ? "No se encontraron resultados" : "No hay miembros disponibles"}
            </p>
          ) : (
            filteredProfiles.map((profile) => {
              const isInvited = invitedIds.has(profile.id);
              
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.photo_url} />
                      <AvatarFallback>
                        {profile.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {profile.role}
                      </p>
                    </div>
                  </div>

                  {isInvited ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      Invitado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => inviteParticipant(profile.id)}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteParticipantDialog;
