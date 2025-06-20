
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  voz_instrumento: string | null;
}

interface WorshipGroup {
  id: string;
  name: string;
  color_theme: string;
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  instrument: string;
  is_leader: boolean;
  joined_date: string;
}

interface GroupMembersManagementProps {
  onUpdate: () => void;
}

const GroupMembersManagement: React.FC<GroupMembersManagementProps> = ({ onUpdate }) => {
  const [groups, setGroups] = useState<WorshipGroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const instruments = [
    'Piano', 'Guitarra', 'Bajo', 'Batería', 'Teclado', 'Violín', 
    'Saxofón', 'Trompeta', 'Flauta', 'Canto', 'Coros', 'Otro'
  ];

  const fetchData = async () => {
    try {
      // Fetch worship groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('worship_groups')
        .select('id, name, color_theme')
        .eq('is_active', true)
        .order('name');

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Fetch all members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, nombres, apellidos, voz_instrumento')
        .eq('is_active', true)
        .order('nombres');

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch group members
      const { data: groupMembersData, error: groupMembersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('is_active', true);

      if (groupMembersError) throw groupMembersError;
      setGroupMembers(groupMembersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    }
  };

  const handleAddMemberToGroup = async () => {
    if (!selectedGroup || !selectedMember || !selectedInstrument) {
      toast({
        title: "Error",
        description: "Por favor selecciona grupo, miembro e instrumento",
        variant: "destructive",
      });
      return;
    }

    // Check if member is already in the group
    const existingMember = groupMembers.find(
      gm => gm.group_id === selectedGroup && gm.user_id === selectedMember
    );

    if (existingMember) {
      toast({
        title: "Error",
        description: "El miembro ya está asignado a este grupo",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: selectedGroup,
            user_id: selectedMember,
            instrument: selectedInstrument,
            is_leader: false,
            is_active: true
          }
        ]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Miembro agregado al grupo correctamente",
      });

      // Reset selections
      setSelectedMember('');
      setSelectedInstrument('');
      
      // Refresh data
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Error adding member to group:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el miembro al grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMemberFromGroup = async (groupMemberId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_members')
        .update({ is_active: false })
        .eq('id', groupMemberId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Miembro removido del grupo correctamente",
      });

      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Error removing member from group:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el miembro del grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedGroupData = groups.find(g => g.id === selectedGroup);
  const currentGroupMembers = groupMembers.filter(gm => gm.group_id === selectedGroup);
  const availableMembers = members.filter(
    m => !currentGroupMembers.some(gm => gm.user_id === m.id)
  );

  return (
    <div className="space-y-6">
      {/* Group Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Grupo</CardTitle>
          <CardDescription>
            Elige el grupo de alabanza para gestionar sus miembros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un grupo de alabanza" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color_theme }}
                    />
                    {group.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedGroup && (
        <>
          {/* Add Member Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Agregar Miembro a {selectedGroupData?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Miembro</label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.nombres} {member.apellidos}
                          {member.voz_instrumento && (
                            <span className="text-gray-500 ml-2">
                              ({member.voz_instrumento})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Instrumento/Voz</label>
                  <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona instrumento" />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((instrument) => (
                        <SelectItem key={instrument} value={instrument}>
                          {instrument}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAddMemberToGroup}
                disabled={loading || !selectedMember || !selectedInstrument}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Agregando...' : 'Agregar Miembro'}
              </Button>
            </CardContent>
          </Card>

          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Miembros Actuales ({currentGroupMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentGroupMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay miembros asignados a este grupo
                </p>
              ) : (
                <div className="space-y-3">
                  {currentGroupMembers.map((groupMember) => {
                    const member = members.find(m => m.id === groupMember.user_id);
                    if (!member) return null;
                    
                    return (
                      <div key={groupMember.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {member.nombres} {member.apellidos}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {groupMember.instrument}
                              </Badge>
                              {groupMember.is_leader && (
                                <Badge variant="default">
                                  Líder
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMemberFromGroup(groupMember.id)}
                          disabled={loading}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GroupMembersManagement;
