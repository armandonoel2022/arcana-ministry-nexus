import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Edit, Trash2, Users, Eye, ArrowUp, ArrowDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type SortOption = 'creation_date' | 'alphabetical';

const MembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('creation_date');
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true }); // Orden por fecha de creación por defecto

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
    let filtered = members.filter(member =>
      member.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.grupo && member.grupo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Aplicar ordenamiento según la opción seleccionada
    if (sortOption === 'alphabetical') {
      filtered = filtered.sort((a, b) => {
        const nameA = `${a.nombres} ${a.apellidos}`.toLowerCase();
        const nameB = `${b.nombres} ${b.apellidos}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Ordenar por fecha de creación (más antiguos primero)
      filtered = filtered.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    setFilteredMembers(filtered);
  }, [searchTerm, members, sortOption]);

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
      'director_musical': 'Director Musical',
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
      'musicos': 'Músicos',
      'multimedia': 'Multimedia',
      'danza': 'Danza',
      'teatro': 'Teatro',
      'piso': 'Piso',
      'grupo_massy': 'Grupo de Massy',
      'grupo_aleida': 'Grupo de Aleida',
      'grupo_keyla': 'Grupo de Keyla'
    };
    return groupLabels[group] || group;
  };

  const handleViewProfile = (memberId: string) => {
    navigate(`/member/${memberId}`);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar integrantes por nombre, cargo o grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creation_date">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4" />
                    Orden de registro
                  </div>
                </SelectItem>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4" />
                    Alfabético (A-Z)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Badge variant="secondary" className="bg-arcana-blue-50 text-arcana-blue-600">
            {filteredMembers.length} integrantes
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Foto */}
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

                  {/* Nombre */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-semibold text-gray-800 cursor-pointer hover:text-arcana-blue-600 transition-colors truncate"
                      onClick={() => handleViewProfile(member.id)}
                    >
                      {member.nombres} {member.apellidos}
                    </h3>
                  </div>

                  {/* Información alineada con ancho fijo */}
                  <div className="hidden sm:flex flex-col gap-1 w-48">
                    <Badge variant="secondary" className="text-xs w-fit">
                      {getRoleLabel(member.cargo)}
                    </Badge>
                    {member.grupo && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {getGroupLabel(member.grupo)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-1 ml-4">
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

              {/* Información adicional en móviles */}
              <div className="block sm:hidden mt-3 space-y-2">
                <Badge variant="secondary" className="text-xs mr-2">
                  {getRoleLabel(member.cargo)}
                </Badge>
                {member.grupo && (
                  <Badge variant="outline" className="text-xs">
                    {getGroupLabel(member.grupo)}
                  </Badge>
                )}
              </div>
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
