
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Users, UserPlus, UserMinus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  room_type: string;
  is_moderated: boolean;
  moderator_id: string;
  member_count: number;
}

interface RoomMember {
  id: string;
  user_id: string;
  role: string;
  can_leave: boolean;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  requested_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export const ChatRoomManagement = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchRoomMembers();
      fetchJoinRequests();
    }
  }, [selectedRoom]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['administrator', 'admin'].includes(profile.role)) {
        toast({
          title: "Acceso Denegado",
          description: "Solo los administradores pueden acceder a esta función",
          variant: "destructive"
        });
        return;
      }
      setCurrentUser(user);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Get member counts
      const { data: memberCounts } = await supabase
        .from('chat_room_members')
        .select('room_id');

      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.room_id] = (acc[member.room_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const roomsWithCount = roomsData?.map(room => ({
        ...room,
        member_count: memberCountMap[room.id] || 0
      })) || [];

      setRooms(roomsWithCount);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las salas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomMembers = async () => {
    if (!selectedRoom) return;

    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('room_id', selectedRoom.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchJoinRequests = async () => {
    if (!selectedRoom) return;

    try {
      const { data, error } = await supabase
        .from('chat_room_join_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('room_id', selectedRoom.id)
        .eq('status', 'pending');

      if (error) throw error;
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  };

  const approveJoinRequest = async (requestId: string, userId: string) => {
    try {
      // Update request status
      await supabase
        .from('chat_room_join_requests')
        .update({
          status: 'approved',
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Add user to room
      await supabase
        .from('chat_room_members')
        .upsert({
          room_id: selectedRoom!.id,
          user_id: userId,
          role: 'member'
        });

      toast({
        title: "Éxito",
        description: "Solicitud aprobada y usuario agregado a la sala"
      });

      fetchJoinRequests();
      fetchRoomMembers();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud",
        variant: "destructive"
      });
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      await supabase
        .from('chat_room_join_requests')
        .update({
          status: 'rejected',
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      toast({
        title: "Éxito",
        description: "Solicitud rechazada"
      });

      fetchJoinRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string, canLeave: boolean) => {
    if (!canLeave) {
      toast({
        title: "Error",
        description: "Este usuario no puede ser removido de esta sala",
        variant: "destructive"
      });
      return;
    }

    try {
      await supabase
        .from('chat_room_members')
        .delete()
        .eq('id', memberId);

      toast({
        title: "Éxito",
        description: "Usuario removido de la sala"
      });

      fetchRoomMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "No se pudo remover al usuario",
        variant: "destructive"
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await supabase
        .from('chat_room_members')
        .update({ role: newRole })
        .eq('id', memberId);

      toast({
        title: "Éxito",
        description: "Rol actualizado correctamente"
      });

      fetchRoomMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando salas...</div>;
  }

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">Acceso Restringido</h3>
        <p className="text-gray-500">Solo los administradores pueden acceder a esta función</p>
      </div>
    );
  }

  if (selectedRoom) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedRoom(null)}
          >
            ← Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedRoom.name}</h2>
            <p className="text-gray-600">Gestión de miembros y solicitudes</p>
          </div>
        </div>

        {/* Join Requests */}
        {joinRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Solicitudes Pendientes ({joinRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(request.profiles.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.profiles.full_name}</p>
                      <p className="text-sm text-gray-600">{request.profiles.email}</p>
                      <p className="text-xs text-gray-500">
                        Solicitado: {new Date(request.requested_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveJoinRequest(request.id, request.user_id)}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectJoinRequest(request.id)}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Room Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Miembros ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(member.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">{member.profiles.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{member.role}</Badge>
                      {!member.can_leave && (
                        <Badge variant="secondary" className="text-xs">
                          Permanente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value) => updateMemberRole(member.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Miembro</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                    </SelectContent>
                  </Select>
                  {member.can_leave && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeMember(member.id, member.can_leave)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-arcana-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Gestión de Salas de Chat</h2>
          <p className="text-gray-600">Administra los miembros y solicitudes de las salas</p>
        </div>
      </div>

      <div className="grid gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{room.name}</h3>
                    <p className="text-gray-600 text-sm">{room.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{room.room_type}</Badge>
                      {room.is_moderated && (
                        <Badge variant="secondary">Moderado</Badge>
                      )}
                      <Badge variant="outline">{room.member_count} miembros</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedRoom(room)}
                  className="bg-arcana-blue-gradient hover:opacity-90"
                >
                  Gestionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
