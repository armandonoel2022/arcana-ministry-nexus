import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Music, Clock, MapPin, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    service_date: string;
    leader: string | null;
    location: string | null;
    description: string | null;
    assigned_group_id: string | null;
    is_confirmed: boolean;
    service_type: string;
    special_activity: string | null;
  };
  onSelect?: (serviceId: string) => void;
  showSongs?: boolean;
}

interface GroupMember {
  id: string;
  user_id: string;
  instrument: string;
  is_leader: boolean;
  member: {
    id: string;
    nombres: string;
    apellidos: string;
    photo_url: string | null;
    voz_instrumento: string | null;
  };
}

interface WorshipGroup {
  id: string;
  name: string;
  color_theme: string;
}

interface SelectedSong {
  song_title: string;
  artist: string | null;
  difficulty_level: number | null;
  selected_by_name: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect, showSongs = false }) => {
  const [groupData, setGroupData] = useState<WorshipGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroupData = async () => {
    if (!service.assigned_group_id) return;

    try {
      setLoading(true);
      
      // Fetch group details
      const { data: group, error: groupError } = await supabase
        .from('worship_groups')
        .select('id, name, color_theme')
        .eq('id', service.assigned_group_id)
        .single();

      if (groupError) throw groupError;
      setGroupData(group);

      // Fetch group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          instrument,
          is_leader,
          members!group_members_user_id_fkey (
            id,
            nombres,
            apellidos,
            photo_url,
            voz_instrumento
          )
        `)
        .eq('group_id', service.assigned_group_id)
        .eq('is_active', true)
        .order('is_leader', { ascending: false });

      if (membersError) throw membersError;
      
      const validMembers = (members || [])
        .filter(item => item.members)
        .map(item => ({
          ...item,
          member: Array.isArray(item.members) ? item.members[0] : item.members
        }));

      setGroupMembers(validMembers as GroupMember[]);

      // Fetch selected songs if requested
      if (showSongs) {
        const { data: songs, error: songsError } = await supabase
          .from('service_selected_songs')
          .select('song_title, artist, difficulty_level, selected_by_name')
          .eq('service_id', service.id);

        if (!songsError && songs) {
          setSelectedSongs(songs);
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [service.assigned_group_id, service.id]);

  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  const getDifficultyColor = (level?: number | null) => {
    if (!level) return "bg-gray-100 text-gray-600";
    if (level <= 2) return "bg-green-100 text-green-700";
    if (level <= 4) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getDifficultyLabel = (level?: number | null) => {
    if (!level) return "Sin nivel";
    if (level <= 2) return "Fácil";
    if (level <= 4) return "Intermedio";
    return "Difícil";
  };

  const leader = groupMembers.find(member => member.is_leader);
  const otherMembers = groupMembers.filter(member => !member.is_leader);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: groupData?.color_theme || '#3B82F6' }}>
      <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {format(new Date(service.service_date), "EEE, d MMM yyyy", { locale: es })}
              </span>
            </div>
            <CardTitle className="text-base sm:text-xl">{service.title}</CardTitle>
            {service.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{service.description}</p>
            )}
          </div>
          <div className="flex flex-row sm:flex-col items-start gap-2 self-start">
            <Badge variant={service.is_confirmed ? "default" : "secondary"} className="text-xs">
              {service.is_confirmed ? "Confirmado" : "Pendiente"}
            </Badge>
            {service.service_type !== 'regular' && (
              <Badge variant="outline" className="text-xs">{service.service_type}</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Service Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
          {service.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{service.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span>{format(new Date(service.service_date), "HH:mm")}</span>
          </div>
        </div>

        {/* Special Activity */}
        {service.special_activity && (
          <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-amber-800">Actividad Especial:</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">{service.special_activity}</p>
          </div>
        )}

        {/* Director and Group */}
        {groupData && (
          <div className="space-y-3 sm:space-y-4">
            {/* Director Section */}
            {leader && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: groupData.color_theme }}
                  ></div>
                  <span className="truncate">Dirige {leader.member.nombres} {leader.member.apellidos}</span>
                </h3>
                <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-primary/20 flex-shrink-0">
                    <AvatarImage 
                      src={leader.member.photo_url || undefined} 
                      alt={`${leader.member.nombres} ${leader.member.apellidos}`}
                    />
                    <AvatarFallback className="text-sm sm:text-lg font-semibold bg-primary/10 text-primary">
                      {getInitials(leader.member.nombres, leader.member.apellidos)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-semibold text-sm sm:text-lg truncate">
                      {leader.member.nombres} {leader.member.apellidos}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Director de Alabanza</p>
                    {leader.instrument && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {leader.instrument}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Group Members */}
            {otherMembers.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  Grupo {groupData.name} ({otherMembers.length} integrantes)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {otherMembers.map((member, index) => (
                    <div key={member.id} className="flex flex-col items-center p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 mb-1 sm:mb-2">
                        <AvatarImage 
                          src={member.member.photo_url || undefined} 
                          alt={`${member.member.nombres} ${member.member.apellidos}`}
                        />
                        <AvatarFallback className="text-xs sm:text-sm font-medium">
                          {getInitials(member.member.nombres, member.member.apellidos)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center space-y-1 w-full">
                        <p className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">
                          {member.member.nombres} {member.member.apellidos}
                        </p>
                        {member.instrument && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {member.instrument}
                          </p>
                        )}
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          Mic #{index + 2}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Songs */}
        {showSongs && selectedSongs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Music className="w-4 h-4" />
              Canciones Seleccionadas ({selectedSongs.length})
            </h4>
            <div className="space-y-2">
              {selectedSongs.map((song, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{song.song_title}</p>
                    {song.artist && (
                      <p className="text-sm text-muted-foreground">{song.artist}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Seleccionada por {song.selected_by_name}
                    </p>
                  </div>
                  {song.difficulty_level && (
                    <Badge 
                      className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}
                      variant="secondary"
                    >
                      {getDifficultyLabel(song.difficulty_level)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onSelect && (
          <Button 
            onClick={() => onSelect(service.id)}
            className="w-full"
            variant="outline"
          >
            Ver Detalles Completos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;