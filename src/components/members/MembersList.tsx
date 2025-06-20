import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Edit, Trash2, Phone, Mail, MapPin, Users, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditMemberForm from './EditMemberForm';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  fecha_nacimiento?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  referencias?: string;
  grupo?: string;
  persona_reporte?: string;
  voz_instrumento?: string;
  tipo_sangre?: string;
  contacto_emergencia?: string;
  is_active: boolean;
  created_at: string;
}

const MembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('nombres', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los integrantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const filtered = members.filter(member =>
      member.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.grupo && member.grupo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este integrante?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({
        title: "Éxito",
        description: "Integrante eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el integrante",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'pastor': 'Pastor',
      'pastora': 'Pastora',
      'director_alabanza': 'Director de Alabanza',
      'directora_alabanza': 'Directora de Alabanza',
      'corista': 'Corista',
      'directora_danza': 'Directora de Danza',
      'director_multimedia': 'Director Multimedia',
      'camarografo': 'Camarógrafo',
      'camarógrafa': 'Camarógrafa',
      'encargado_piso': 'Encargado de Piso',
      'encargada_piso': 'Encargada de Piso',
      'musico': 'Músico',
      'sonidista': 'Sonidista',
      'encargado_luces': 'Encargado de Luces',
      'encargado_proyeccion': 'Encargado de Proyección',
      'encargado_streaming': 'Encargado de Streaming'
    };
    return roleLabels[role] || role;
  };

  const getGroupLabel = (group: string) => {
    const groupLabels: { [key: string]: string } = {
      'directiva': 'Directiva',
      'directores_alabanza': 'Directores de Alabanza',
      'coristas': 'Coristas',
      'multimedia': 'Multimedia',
      'danza': 'Danza',
      'teatro': 'Teatro',
      'piso': 'Piso'
    };
    return groupLabels[group] || group;
  };

  const handleViewProfile = (memberId: string) => {
    navigate(`/integrantes/${memberId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcana-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando integrantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar integrantes por nombre, cargo o grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="bg-arcana-blue-50 text-arcana-blue-600">
          {filteredMembers.length} integrantes
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleViewProfile(member.id)}
                  >
                    <Avatar className="w-12 h-12 ring-2 ring-transparent hover:ring-arcana-blue-300">
                      <AvatarImage
                        src={member.photo_url || undefined}
                        alt={`${member.nombres} ${member.apellidos}`}
                      />
                      <AvatarFallback className="bg-arcana-blue-gradient text-white">
                        {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <CardTitle 
                      className="text-lg cursor-pointer hover:text-arcana-blue-600 transition-colors"
                      onClick={() => handleViewProfile(member.id)}
                    >
                      {member.nombres} {member.apellidos}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {getRoleLabel(member.cargo)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProfile(member.id)}
                    className="text-arcana-blue-600 hover:text-arcana-blue-700 hover:bg-arcana-blue-50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMember(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle>Editar Integrante</SheetTitle>
                        <SheetDescription>
                          Modifica la información del integrante
                        </SheetDescription>
                      </SheetHeader>
                      {editingMember && (
                        <EditMemberForm 
                          member={editingMember} 
                          onSuccess={() => {
                            fetchMembers();
                            setEditingMember(null);
                          }}
                        />
                      )}
                    </SheetContent>
                  </Sheet>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.grupo && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getGroupLabel(member.grupo)}
                  </Badge>
                </div>
              )}
              
              {member.voz_instrumento && (
                <div className="text-sm text-gray-600">
                  <strong>Instrumento/Voz:</strong> {member.voz_instrumento}
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                {member.celular && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>{member.celular}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs truncate">{member.direccion}</span>
                  </div>
                )}
              </div>

              {member.fecha_nacimiento && (
                <div className="text-xs text-gray-500">
                  <strong>Nacimiento:</strong> {new Date(member.fecha_nacimiento).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && !loading && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No se encontraron integrantes con esos criterios' : 'No hay integrantes registrados'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MembersList;
