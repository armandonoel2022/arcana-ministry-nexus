
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Edit, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorshipGroup {
  id: string;
  name: string;
  description: string | null;
  color_theme: string;
  is_active: boolean;
  created_at: string;
  _count?: {
    members: number;
  };
}

interface WorshipGroupsListProps {
  onUpdate: () => void;
}

const WorshipGroupsList: React.FC<WorshipGroupsListProps> = ({ onUpdate }) => {
  const [groups, setGroups] = useState<WorshipGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('worship_groups')
        .select(`
          id,
          name,
          description,
          color_theme,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Fetch member counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          // Map group names to the corresponding enum values in the members table
          let groupEnum = '';
          if (group.name === 'Grupo de Massy') {
            groupEnum = 'grupo_massy';
          } else if (group.name === 'Grupo de Aleida') {
            groupEnum = 'grupo_aleida';
          } else if (group.name === 'Grupo de Keyla') {
            groupEnum = 'grupo_keyla';
          }

          let count = 0;
          if (groupEnum) {
            const result = await supabase
              .from('members')
              .select('*', { count: 'exact', head: true })
              .eq('grupo', groupEnum)
              .eq('is_active', true);
            count = result.count || 0;
          }

          return {
            ...group,
            _count: { members: count }
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching worship groups:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos de alabanza",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (groupId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('worship_groups')
        .update({ is_active: !currentStatus })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Grupo ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });

      fetchGroups();
      onUpdate();
    } catch (error) {
      console.error('Error updating group status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del grupo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay grupos de alabanza registrados</p>
          <p className="text-sm text-gray-500">Utiliza la pestaña "Crear Grupo" para agregar el primer grupo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <Card key={group.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: group.color_theme }}
                >
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Badge variant={group.is_active ? "default" : "secondary"}>
                    {group.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {group.description && (
              <CardDescription>{group.description}</CardDescription>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Miembros:</span>
              <Badge variant="outline">
                {group._count?.members || 0}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <UserPlus className="w-4 h-4 mr-1" />
                Miembros
              </Button>
              <Button 
                size="sm" 
                variant={group.is_active ? "destructive" : "default"}
                onClick={() => handleToggleActive(group.id, group.is_active)}
              >
                {group.is_active ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WorshipGroupsList;
