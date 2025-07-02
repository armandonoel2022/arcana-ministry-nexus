import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, CheckCircle, XCircle, Music, Calendar, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addWeeks, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

type FilterType = 'current_weekend' | 'month' | 'all' | 'my_agenda';

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

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [services, filter]);

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

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...services];

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
          service.leader.toLowerCase().includes('armando noel')
        );
        break;
      
      case 'my_agenda':
        // Show only MY services for the current weekend
        const { start: myWeekStart, end: myWeekEnd } = getCurrentWeekend();
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: myWeekStart, end: myWeekEnd }) &&
          service.leader.toLowerCase().includes('armando noel')
        );
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros de Vista
          </CardTitle>
          <CardDescription>
            Seleccione el período de servicios que desea visualizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'current_weekend' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('current_weekend')}
            >
              Fin de Semana Actual
            </Button>
            <Button
              variant={filter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('month')}
            >
              Este Mes
            </Button>
            <Button
              variant={filter === 'my_agenda' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('my_agenda')}
              className="flex items-center gap-1"
            >
              <User className="w-4 h-4" />
              Ver Mi Agenda
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos los Servicios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {getFilterLabel(filter)} ({filteredServices.length} servicios)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {filter === 'my_agenda' 
                ? "🎉 ¡Estás libre este fin de semana!" 
                : filter === 'month'
                ? "No tienes servicios asignados este mes."
                : "No hay servicios programados para este período."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Mes</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Dirige</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Canciones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        {format(new Date(service.service_date), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.month_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.month_order}°</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {service.leader}
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
                      <TableCell>
                        {service.worship_groups ? (
                          <Badge 
                            style={{ 
                              backgroundColor: service.worship_groups.color_theme + '20',
                              color: service.worship_groups.color_theme,
                              borderColor: service.worship_groups.color_theme + '40'
                            }}
                          >
                            {service.worship_groups.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getServiceTypeColor(service.service_type)}>
                          {service.service_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {service.service_songs && service.service_songs.length > 0 ? (
                          <div className="space-y-1">
                            {service.service_songs
                              .sort((a, b) => a.song_order - b.song_order)
                              .slice(0, 3)
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
                            {service.service_songs.length > 3 && (
                              <div className="text-xs text-gray-500 mt-1">
                                +{service.service_songs.length - 3} más...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin canciones</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.is_confirmed ? "default" : "secondary"}>
                          {service.is_confirmed ? 'Confirmado' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleConfirmation(service.id, service.is_confirmed)}
                          >
                            {service.is_confirmed ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </div>
  );
};
