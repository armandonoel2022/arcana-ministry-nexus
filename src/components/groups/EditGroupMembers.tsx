import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Mic,
  X,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  voz_instrumento: string | null;
  cargo: string;
  photo_url: string | null;
}

interface GroupMemberWithDetails {
  id: string;
  group_id: string;
  user_id: string;
  instrument: string;
  is_leader: boolean;
  is_active: boolean;
  notes: string | null;
  mic_order: number | null;
  member: Member;
}

interface EditGroupMembersProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const voiceOptions = [
  'Voz Soprano',
  'Voz Contralto', 
  'Voz Tenor',
  'Voz Bajo',
  'Piano',
  'Guitarra',
  'Bajo',
  'Batería',
  'Teclado',
  'Otro'
];

// Map Spanish voice/instrument options to database enum values
const voiceToEnumMap: Record<string, string> = {
  'Voz Soprano': 'vocals',
  'Voz Contralto': 'vocals',
  'Voz Tenor': 'vocals',
  'Voz Bajo': 'vocals',
  'Piano': 'piano',
  'Guitarra': 'guitar',
  'Bajo': 'bass',
  'Batería': 'drums',
  'Teclado': 'piano',
  'Otro': 'other'
};

const EditGroupMembers: React.FC<EditGroupMembersProps> = ({ 
  groupId, 
  groupName, 
  isOpen, 
  onClose, 
  onUpdate 
}) => {
  const [groupMembers, setGroupMembers] = useState<GroupMemberWithDetails[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editVoice, setEditVoice] = useState<string>('');
  const [editingMicOrder, setEditingMicOrder] = useState<string | null>(null);
  const [editMicNumber, setEditMicNumber] = useState<string>('');
  const { toast } = useToast();

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          instrument,
          is_leader,
          is_active,
          notes,
          mic_order,
          members!group_members_user_id_fkey (
            id,
            nombres,
            apellidos,
            voz_instrumento,
            cargo,
            photo_url
          )
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('mic_order', { ascending: true, nullsFirst: false })
        .order('is_leader', { ascending: false })
        .order('created_at');

      if (error) throw error;

      const membersWithDetails = (data || [])
        .filter(item => item.members)
        .map(item => ({
          ...item,
          member: Array.isArray(item.members) ? item.members[0] : item.members
        }));

      setGroupMembers(membersWithDetails as GroupMemberWithDetails[]);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del grupo",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, nombres, apellidos, voz_instrumento, cargo, photo_url')
        .eq('is_active', true)
        .order('nombres');

      if (error) throw error;

      // Filter out members already in the group
      const currentMemberIds = groupMembers.map(gm => gm.user_id);
      const available = (data || []).filter(member => !currentMemberIds.includes(member.id));
      
      console.log('Available members:', available);
      console.log('Current member IDs:', currentMemberIds);
      
      setAvailableMembers(available);
    } catch (error) {
      console.error('Error fetching available members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros disponibles",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async () => {
    if (!selectedMember || !selectedVoice) {
      toast({
        title: "Error",
        description: "Por favor selecciona un miembro y especifica su voz/instrumento",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if member is already in the group
      const existingMember = groupMembers.find(gm => gm.user_id === selectedMember);
      
      if (existingMember) {
        // Reactivate the member instead of creating a new one
        const instrumentEnumValue = voiceToEnumMap[selectedVoice] || 'other';
        
        const { error: updateError } = await supabase
          .from('group_members')
          .update({
            is_active: true,
            instrument: instrumentEnumValue
          })
          .eq('id', existingMember.id);

        if (updateError) throw updateError;

        toast({
          title: "Éxito",
          description: "Miembro reactivado en el grupo",
        });
      } else {
        // Convert Spanish voice option to database enum value
        const instrumentEnumValue = voiceToEnumMap[selectedVoice] || 'other';
        
        // Get next mic order number
        const maxMicOrder = groupMembers.reduce((max, gm) => 
          gm.mic_order && gm.mic_order > max ? gm.mic_order : max, 0
        );
        
        const { error } = await supabase
          .from('group_members')
          .insert([
            {
              group_id: groupId,
              user_id: selectedMember,
              instrument: instrumentEnumValue,
              is_leader: false,
              is_active: true,
              mic_order: maxMicOrder + 1
            }
          ]);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Miembro agregado al grupo correctamente",
        });
      }

      // Update the member's voice in the members table (keep Spanish label)
      await supabase
        .from('members')
        .update({ voz_instrumento: selectedVoice })
        .eq('id', selectedMember);

      setSelectedMember('');
      setSelectedVoice('');
      await fetchGroupMembers();
      await fetchAvailableMembers();
      onUpdate();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el miembro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Miembro removido del grupo",
      });

      await fetchGroupMembers();
      await fetchAvailableMembers();
      onUpdate();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el miembro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVoice = async (memberId: string, newVoice: string) => {
    try {
      setLoading(true);
      
      const member = groupMembers.find(gm => gm.id === memberId);
      if (!member) return;

      // Convert Spanish voice option to database enum value
      const instrumentEnumValue = voiceToEnumMap[newVoice] || 'other';

      // Update group_members table with enum value
      const { error: groupError } = await supabase
        .from('group_members')
        .update({ instrument: instrumentEnumValue })
        .eq('id', memberId);

      if (groupError) throw groupError;

      // Update members table with Spanish label
      const { error: memberError } = await supabase
        .from('members')
        .update({ voz_instrumento: newVoice })
        .eq('id', member.user_id);

      if (memberError) throw memberError;

      toast({
        title: "Éxito",
        description: "Voz/instrumento actualizado correctamente",
      });

      setEditingMember(null);
      await fetchGroupMembers();
      onUpdate();
    } catch (error) {
      console.error('Error updating voice:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la voz/instrumento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    try {
      setLoading(true);
      const currentMember = groupMembers[index];
      const previousMember = groupMembers[index - 1];
      
      // Swap mic_order values
      const currentOrder = currentMember.mic_order || index + 1;
      const previousOrder = previousMember.mic_order || index;
      
      await supabase
        .from('group_members')
        .update({ mic_order: previousOrder })
        .eq('id', currentMember.id);
        
      await supabase
        .from('group_members')
        .update({ mic_order: currentOrder })
        .eq('id', previousMember.id);
      
      toast({
        title: "Éxito",
        description: "Orden de micrófono actualizado",
      });
      
      await fetchGroupMembers();
      onUpdate();
    } catch (error) {
      console.error('Error moving member up:', error);
      toast({
        title: "Error",
        description: "No se pudo reordenar el miembro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === groupMembers.length - 1) return;
    
    try {
      setLoading(true);
      const currentMember = groupMembers[index];
      const nextMember = groupMembers[index + 1];
      
      // Swap mic_order values
      const currentOrder = currentMember.mic_order || index + 1;
      const nextOrder = nextMember.mic_order || index + 2;
      
      await supabase
        .from('group_members')
        .update({ mic_order: nextOrder })
        .eq('id', currentMember.id);
        
      await supabase
        .from('group_members')
        .update({ mic_order: currentOrder })
        .eq('id', nextMember.id);
      
      toast({
        title: "Éxito",
        description: "Orden de micrófono actualizado",
      });
      
      await fetchGroupMembers();
      onUpdate();
    } catch (error) {
      console.error('Error moving member down:', error);
      toast({
        title: "Error",
        description: "No se pudo reordenar el miembro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMicOrder = async (memberId: string, newOrder: string) => {
    const orderNum = parseInt(newOrder);
    if (isNaN(orderNum) || orderNum < 1 || orderNum > groupMembers.length) {
      toast({
        title: "Error",
        description: `El número debe estar entre 1 y ${groupMembers.length}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_members')
        .update({ mic_order: orderNum })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Número de micrófono actualizado",
      });

      setEditingMicOrder(null);
      setEditMicNumber('');
      await fetchGroupMembers();
      onUpdate();
    } catch (error) {
      console.error('Error updating mic order:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el número de micrófono",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  const getMicrophoneNumber = (index: number) => {
    return `Micrófono #${index + 1}`;
  };

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupMembers();
    }
  }, [isOpen, groupId]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers();
    }
  }, [groupMembers, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Miembros - {groupName}
          </DialogTitle>
          <DialogDescription>
            Gestiona los miembros del grupo, sus voces/instrumentos y orden de micrófonos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Member Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Agregar Nuevo Miembro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Seleccionar Miembro</label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.length === 0 ? (
                        <SelectItem value="no-members" disabled>
                          No hay miembros disponibles
                        </SelectItem>
                      ) : (
                        availableMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-3 py-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={member.photo_url || undefined} alt={`${member.nombres} ${member.apellidos}`} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                  {getInitials(member.nombres, member.apellidos)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{member.nombres} {member.apellidos}</span>
                                {member.voz_instrumento && (
                                  <span className="text-xs text-muted-foreground">
                                    {member.voz_instrumento}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Voz/Instrumento</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Especifica voz o instrumento" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice} value={voice}>
                          {voice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAddMember}
                disabled={loading || !selectedMember || !selectedVoice}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Agregando...' : 'Agregar Miembro'}
              </Button>
            </CardContent>
          </Card>

          {/* Current Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4" />
                Miembros Actuales ({groupMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay miembros en este grupo
                </p>
              ) : (
                <div className="space-y-3">
                  {groupMembers.map((groupMember, index) => (
                    <div key={groupMember.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0 || loading}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === groupMembers.length - 1 || loading}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                          {editingMicOrder === groupMember.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max={groupMembers.length}
                                value={editMicNumber}
                                onChange={(e) => setEditMicNumber(e.target.value)}
                                className="w-12 h-6 px-1 text-xs text-center border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateMicOrder(groupMember.id, editMicNumber)}
                                disabled={loading || !editMicNumber}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMicOrder(null);
                                  setEditMicNumber('');
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                setEditingMicOrder(groupMember.id);
                                setEditMicNumber(String(groupMember.mic_order || index + 1));
                              }}
                            >
                              <Mic className="w-3 h-3 mr-1" />
                              #{groupMember.mic_order || index + 1}
                            </Badge>
                          )}
                        </div>

                        <Avatar className="w-12 h-12">
                          <AvatarImage 
                            src={groupMember.member.photo_url || undefined} 
                            alt={`${groupMember.member.nombres} ${groupMember.member.apellidos}`}
                          />
                          <AvatarFallback>
                            {getInitials(groupMember.member.nombres, groupMember.member.apellidos)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col">
                          <span className="font-medium">
                            {groupMember.member.nombres} {groupMember.member.apellidos}
                          </span>
                          
                          {editingMember === groupMember.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Select value={editVoice} onValueChange={setEditVoice}>
                                <SelectTrigger className="h-8 w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {voiceOptions.map((voice) => (
                                    <SelectItem key={voice} value={voice}>
                                      {voice}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateVoice(groupMember.id, editVoice)}
                                disabled={loading || !editVoice}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMember(null)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-gray-200"
                                onClick={() => {
                                  setEditingMember(groupMember.id);
                                  setEditVoice(groupMember.instrument);
                                }}
                              >
                                {groupMember.instrument}
                                <Edit className="w-3 h-3 ml-1" />
                              </Badge>
                              {groupMember.is_leader && (
                                <Badge variant="default" className="text-xs">
                                  Líder
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveMember(groupMember.id)}
                        disabled={loading}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupMembers;