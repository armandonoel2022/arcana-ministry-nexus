import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, CheckCircle, XCircle, Music, Calendar, User, UserCheck } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addWeeks, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceActionsMenu from './ServiceActionsMenu';
import DirectorChangeRequest from './DirectorChangeRequest';
import SelectedSongsDisplay from './SelectedSongsDisplay';
import { EditServiceForm } from './EditServiceForm';
import { EditSelectedSongsDialog } from './EditSelectedSongsDialog';

interface Service {
  id: string;
  leader: string;
  service_date: string;
  month_name: string;
  month_order: number;
  assigned_group_id: string | null;
  title: string;
  service_type: string;
  location: string;
  special_activity: string | null;
  choir_breaks: string | null;
  is_confirmed: boolean;
  description: string | null;
  notes: string | null;
  worship_groups?: {
    name: string;
    color_theme: string;
  };
  service_songs?: {
    song_order: number;
    songs: {
      id: string;
      title: string;
      artist: string | null;
    };
  }[];
}

type FilterType = 'current_weekend' | 'month' | 'all' | 'my_agenda' | 'year_2025' | 'year_2026';

interface AgendaTableProps {
  initialFilter?: string | null;
}

export const AgendaTable: React.FC<AgendaTableProps> = ({ initialFilter }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>(() => {
    if (initialFilter === 'my_agenda') return 'my_agenda';
    return 'current_weekend';
  });
  const [selectedServiceForReplacement, setSelectedServiceForReplacement] = useState<Service | null>(null);
  const [selectedServiceForSongs, setSelectedServiceForSongs] = useState<Service | null>(null);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<Service | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [editingSongsServiceId, setEditingSongsServiceId] = useState<string | null>(null);
  const [editingSongsServiceTitle, setEditingSongsServiceTitle] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    getCurrentUser();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [services, filter]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUserName(profile.full_name.toLowerCase());
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          worship_groups (
            name,
            color_theme
          ),
          service_songs (
            song_order,
            songs (
              id,
              title,
              artist
            )
          )
        `)
        .order('service_date', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentWeekend = () => {
    const now = new Date();
    const currentDay = getDay(now); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    let weekStart, weekEnd;
    
    // Si estamos entre lunes (1) y jueves (4), mostrar el próximo fin de semana
    if (currentDay >= 1 && currentDay <= 4) {
      // Obtener el próximo viernes
      const daysUntilFriday = 5 - currentDay; // 5 = Friday
      weekStart = new Date(now);
      weekStart.setDate(now.getDate() + daysUntilFriday);
      weekStart.setHours(0, 0, 0, 0);
      
      // El domingo será 2 días después del viernes
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 2);
      weekEnd.setHours(23, 59, 59, 999);
    } else {
      // Si estamos en viernes (5), sábado (6) o domingo (0), mostrar el fin de semana actual
      if (currentDay === 0) {
        // Si es domingo, el fin de semana empezó el viernes anterior
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 2);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd = new Date(now);
        weekEnd.setHours(23, 59, 59, 999);
      } else {
        // Si es viernes o sábado
        const daysFromFriday = currentDay - 5; // 0 para viernes, 1 para sábado
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysFromFriday);
        weekStart.setHours(0, 0, 0, 0);
        
        weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 2);
        weekEnd.setHours(23, 59, 59, 999);
      }
    }
    
    return { start: weekStart, end: weekEnd };
  };

  // Helper function to normalize strings (remove accents) for comparison
  const normalizeString = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...services];
    const normalizedUserName = normalizeString(currentUserName);

    switch (filter) {
      case 'current_weekend':
        const { start: weekStart, end: weekEnd } = getCurrentWeekend();
        console.log('Filtering weekend from:', weekStart, 'to:', weekEnd);
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: weekStart, end: weekEnd })
        );
        break;
      
      case 'month':
        // Show only MY services for the current month
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: monthStart, end: monthEnd }) &&
          normalizeString(service.leader).includes(normalizedUserName)
        );
        break;
      
      case 'my_agenda':
        // Show only MY services for the current weekend
        const { start: myWeekStart, end: myWeekEnd } = getCurrentWeekend();
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: myWeekStart, end: myWeekEnd }) &&
          normalizeString(service.leader).includes(normalizedUserName)
        );
        break;
      
      case 'year_2025':
        filtered = services.filter(service => {
          const year = new Date(service.service_date).getFullYear();
          return year === 2025;
        });
        break;
      
      case 'year_2026':
        filtered = services.filter(service => {
          const year = new Date(service.service_date).getFullYear();
          return year === 2026;
        });
        break;
      
      case 'all':
      default:
        filtered = services;
        break;
    }

    setFilteredServices(filtered);
  };

  const toggleConfirmation = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_confirmed: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setServices(prev => 
        prev.map(service => 
          service.id === id 
            ? { ...service, is_confirmed: !currentStatus }
            : service
        )
      );

      toast.success(
        !currentStatus ? 'Servicio confirmado' : 'Confirmación removida'
      );
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Error al actualizar el servicio');
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este servicio?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(service => service.id !== id));
      toast.success('Servicio eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const handleRequestDirectorChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedServiceForReplacement(service);
    }
  };

  const handleEditSongs = (serviceId: string, serviceTitle: string) => {
    setEditingSongsServiceId(serviceId);
    setEditingSongsServiceTitle(serviceTitle);
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'especial': return 'bg-purple-100 text-purple-800';
      case 'conferencia': return 'bg-blue-100 text-blue-800';
      case 'evento': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case 'current_weekend': return 'Fin de Semana Actual';
      case 'month': return 'Mis Servicios - Este Mes';
      case 'my_agenda': return 'Mi Agenda - Fin de Semana';
      case 'year_2025': return 'Servicios 2025';
      case 'year_2026': return 'Servicios 2026';
      case 'all': return 'Todos los Servicios';
      default: return 'Filtro';
    }
  };

  const shouldShowChoirBreaks = () => {
    return filter !== 'all' && filteredServices.some(s => s.choir_breaks);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Cargando servicios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            Filtros de Vista
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Seleccione el período de servicios que desea visualizar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button
                variant={filter === 'current_weekend' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('current_weekend')}
                className="text-xs sm:text-sm"
              >
                Fin de Semana
              </Button>
              <Button
                variant={filter === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('month')}
                className="text-xs sm:text-sm"
              >
                Este Mes
              </Button>
              <Button
                variant={filter === 'my_agenda' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('my_agenda')}
                className="flex items-center gap-1 text-xs sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Ver Mi Agenda</span>
                <span className="sm:hidden">Mi Agenda</span>
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs sm:text-sm"
              >
                Todos
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-xs sm:text-sm text-gray-600 font-medium self-center mr-1 sm:mr-2">Por Año:</span>
              <Button
                variant={filter === 'year_2025' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('year_2025')}
                className="text-xs sm:text-sm"
              >
                2025
              </Button>
              <Button
                variant={filter === 'year_2026' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('year_2026')}
                className="text-xs sm:text-sm"
              >
                2026
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {getFilterLabel(filter)} ({filteredServices.length} servicios)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {filteredServices.length === 0 ? (
            <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
              {filter === 'my_agenda' 
                ? "🎉 ¡Estás libre este fin de semana!" 
                : filter === 'month'
                ? "No tienes servicios asignados este mes."
                : "No hay servicios programados para este período."}
            </div>
          ) : (
            <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-[800px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Fecha</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Mes</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Orden</TableHead>
                    <TableHead className="text-xs sm:text-sm">Dirige</TableHead>
                    <TableHead className="text-xs sm:text-sm">Servicio</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Grupo</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Canciones</TableHead>
                    <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                    <TableHead className="text-xs sm:text-sm">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="font-medium">
                          {format(new Date(service.service_date), 'dd/MM', { locale: es })}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 sm:hidden">
                          {format(new Date(service.service_date), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm hidden sm:table-cell">
                        {service.month_name}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{service.month_order}°</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <div className="max-w-[80px] sm:max-w-none truncate">
                          {service.leader}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.title}</div>
                          {service.special_activity && (
                            <div className="text-sm text-gray-500 mt-1">
                              {service.special_activity}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {service.worship_groups ? (
                          <Badge 
                            className="text-xs"
                            style={{ 
                              backgroundColor: service.worship_groups.color_theme + '20',
                              color: service.worship_groups.color_theme,
                              borderColor: service.worship_groups.color_theme + '40'
                            }}
                          >
                            {service.worship_groups.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={`${getServiceTypeColor(service.service_type)} text-xs`}>
                          {service.service_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {/* Service Songs (from service_songs table) */}
                          {service.service_songs && service.service_songs.length > 0 ? (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 font-medium">Repertorio:</div>
                              {service.service_songs
                                .sort((a, b) => a.song_order - b.song_order)
                                .slice(0, 2)
                                .map((serviceSong, index) => (
                                  <div key={index} className="flex items-center gap-1 text-sm">
                                    <Music className="w-3 h-3 text-gray-400" />
                                    <span className="truncate max-w-32">
                                      {serviceSong.songs.title}
                                      {serviceSong.songs.artist && (
                                        <span className="text-gray-500 text-xs ml-1">
                                          - {serviceSong.songs.artist}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              {service.service_songs.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{service.service_songs.length - 2} más...
                                </div>
                              )}
                            </div>
                          ) : null}
                          
                          {/* Selected Songs (from song_selections table) */}
                          <div>
                            <div className="text-xs text-blue-600 font-medium mb-1">Seleccionadas:</div>
                            <SelectedSongsDisplay 
                              serviceId={service.id} 
                              serviceTitle={service.title}
                              compact={true} 
                            />
                          </div>
                          
                          {/* View all selected songs button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedServiceForSongs(service)}
                            className="text-xs h-6 px-2"
                          >
                            Ver todas las seleccionadas
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.is_confirmed ? "default" : "secondary"}>
                          {service.is_confirmed ? 'Confirmado' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedServiceForEdit(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteService(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ServiceActionsMenu
                            service={service}
                            currentUser={currentUserName}
                            onToggleConfirmation={toggleConfirmation}
                            onDelete={deleteService}
                            onRequestDirectorChange={handleRequestDirectorChange}
                            onEditSongs={handleEditSongs}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Choir Breaks Card - Only show when not viewing all services */}
      {shouldShowChoirBreaks() && (
        <Card>
          <CardHeader>
            <CardTitle>Descansos de los Coros</CardTitle>
            <CardDescription>
              Información sobre descansos programados en el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredServices
                .filter(s => s.choir_breaks)
                .map(service => (
                  <div key={service.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">
                      {format(new Date(service.service_date), 'dd/MM/yyyy', { locale: es })} - {service.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {service.choir_breaks}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Director Change Request Dialog */}
      <Dialog open={!!selectedServiceForReplacement} onOpenChange={() => setSelectedServiceForReplacement(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Solicitar Reemplazo de Director
            </DialogTitle>
          </DialogHeader>
          {selectedServiceForReplacement && (
            <DirectorChangeRequest
              serviceId={selectedServiceForReplacement.id}
              currentDirector={selectedServiceForReplacement.leader}
              serviceDate={selectedServiceForReplacement.service_date}
              serviceTitle={selectedServiceForReplacement.title}
              onRequestCreated={() => {
                setSelectedServiceForReplacement(null);
                fetchServices();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Selected Songs Dialog with Edit Functionality */}
      {editingSongsServiceId && (
        <EditSelectedSongsDialog
          serviceId={editingSongsServiceId}
          serviceTitle={editingSongsServiceTitle}
          open={!!editingSongsServiceId}
          onOpenChange={(open) => !open && setEditingSongsServiceId(null)}
          onSongsUpdated={fetchServices}
        />
      )}

      {selectedServiceForSongs && (
        <EditSelectedSongsDialog
          serviceId={selectedServiceForSongs.id}
          serviceTitle={selectedServiceForSongs.title}
          open={!!selectedServiceForSongs}
          onOpenChange={(open) => !open && setSelectedServiceForSongs(null)}
          onSongsUpdated={fetchServices}
        />
      )}

      {/* Edit Service Dialog */}
      <Dialog open={!!selectedServiceForEdit} onOpenChange={() => setSelectedServiceForEdit(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Servicio
            </DialogTitle>
          </DialogHeader>
          {selectedServiceForEdit && (
            <EditServiceForm
              service={selectedServiceForEdit}
              onServiceUpdated={() => {
                setSelectedServiceForEdit(null);
                fetchServices();
              }}
              onCancel={() => setSelectedServiceForEdit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
