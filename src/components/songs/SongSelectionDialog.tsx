
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, User, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  title: string;
  service_date: string;
  leader: string;
  location: string;
  special_activity?: string;
  worship_groups?: {
    name: string;
    color_theme: string;
  } | null;
}

interface Song {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  difficulty_level?: number;
  key_signature?: string;
  tags?: string[];
}

interface SongSelectionDialogProps {
  song: Song;
  children: React.ReactNode;
}

const SongSelectionDialog: React.FC<SongSelectionDialogProps> = ({ song, children }) => {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  const loadUpcomingServices = async () => {
    if (servicesLoaded) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes estar autenticado para seleccionar canciones');
        return;
      }

      // Get user's profile to check their role and assigned groups
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          service_date,
          leader,
          location,
          special_activity,
          worship_groups (
            name,
            color_theme
          )
        `)
        .gte('service_date', new Date().toISOString())
        .order('service_date', { ascending: true })
        .limit(10);

      // If user is not an administrator, filter services where they are the leader
      if (profile?.role !== 'administrator') {
        query = query.eq('leader', profile?.full_name);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our Service interface
      const transformedServices = (data || []).map(service => ({
        ...service,
        worship_groups: Array.isArray(service.worship_groups) && service.worship_groups.length > 0 
          ? service.worship_groups[0] 
          : null
      }));
      
      setServices(transformedServices);
      setServicesLoaded(true);

      if (transformedServices.length === 0) {
        toast.info('No tienes servicios próximos asignados');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Error al cargar los servicios');
    }
  };

  const handleSelectSong = async () => {
    if (!selectedService) {
      toast.error('Por favor selecciona un servicio');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Create song selection
      const { error: selectionError } = await supabase
        .from('song_selections')
        .insert({
          service_id: selectedService,
          song_id: song.id,
          selected_by: user.id,
          selection_reason: reason || 'Seleccionada para el servicio'
        });

      if (selectionError) throw selectionError;

      // Get service details for notification  
      const selectedServiceData = services.find(s => s.id === selectedService);
      
      // Create notification for the service leader and group members
      if (selectedServiceData) {
        const { error: notificationError } = await supabase
          .from('system_notifications')
          .insert({
            type: 'song_selection',
            title: 'Nueva Selección de Canción',
            message: `Se ha seleccionado "${song.title}" para el servicio "${selectedServiceData.title}" del ${format(new Date(selectedServiceData.service_date), 'dd/MM/yyyy', { locale: es })}.`,
            notification_category: 'repertory',
            priority: 2,
            metadata: {
              song_id: song.id,
              song_title: song.title,
              service_id: selectedService,
              service_title: selectedServiceData.title,
              service_date: selectedServiceData.service_date,
              reason: reason || 'Seleccionada para el servicio',
              selected_by_name: user.user_metadata?.full_name || user.email
            }
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      toast.success('Canción seleccionada exitosamente');
      setOpen(false);
      setSelectedService('');
      setReason('');
    } catch (error) {
      console.error('Error selecting song:', error);
      toast.error('Error al seleccionar la canción');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyLabel = (level?: number) => {
    const labels = {
      1: 'Muy Fácil',
      2: 'Fácil', 
      3: 'Intermedio',
      4: 'Difícil',
      5: 'Muy Difícil'
    };
    return labels[level as keyof typeof labels] || 'N/A';
  };

  const getDifficultyColor = (level?: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={loadUpcomingServices}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Seleccionar para Servicio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Song Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{song.title}</CardTitle>
              {song.artist && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-3 h-3 mr-1" />
                  {song.artist}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {song.genre && (
                  <Badge variant="secondary">{song.genre}</Badge>
                )}
                {song.key_signature && (
                  <Badge variant="outline">{song.key_signature}</Badge>
                )}
                {song.difficulty_level && (
                  <Badge className={getDifficultyColor(song.difficulty_level)}>
                    {getDifficultyLabel(song.difficulty_level)}
                  </Badge>
                )}
              </div>
              {song.tags && song.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {song.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Seleccionar Servicio
              </label>
              {services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <p>No tienes servicios próximos asignados</p>
                </div>
              ) : (
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un servicio próximo" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="space-y-1">
                          <div className="font-medium">{service.title}</div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(service.service_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {service.leader}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {service.location}
                            </div>
                          </div>
                          {service.worship_groups && (
                            <Badge 
                              className="text-xs"
                              style={{ 
                                backgroundColor: service.worship_groups.color_theme + '20',
                                color: service.worship_groups.color_theme,
                                border: `1px solid ${service.worship_groups.color_theme}40`
                              }}
                            >
                              {service.worship_groups.name}
                            </Badge>
                          )}
                          {service.special_activity && (
                            <div className="text-xs text-purple-600">
                              <Star className="w-3 h-3 inline mr-1" />
                              {service.special_activity}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notas adicionales (opcional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Añade notas sobre por qué esta canción es adecuada para este servicio..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSelectSong} 
              disabled={isLoading || !selectedService || services.length === 0}
              className="flex-1"
            >
              {isLoading ? 'Seleccionando...' : 'Seleccionar Canción'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongSelectionDialog;
