
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, CheckCircle, XCircle, Music, Calendar, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
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

type FilterType = 'current_weekend' | 'week' | 'month' | 'all' | 'my_agenda';

export const AgendaTable: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('current_weekend');

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

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...services];

    switch (filter) {
      case 'current_weekend':
        // Show services from Friday to Sunday of current week
        const weekStart = startOfWeek(now, { weekStartsOn: 5 }); // Friday
        const weekEnd = endOfWeek(now, { weekStartsOn: 5 }); // Sunday
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: weekStart, end: weekEnd })
        );
        break;
      
      case 'week':
        // Show services for the current week (Monday to Sunday)
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: currentWeekStart, end: currentWeekEnd })
        );
        break;
      
      case 'month':
        // Show services for the current month
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = services.filter(service => 
          isWithinInterval(new Date(service.service_date), { start: monthStart, end: monthEnd })
        );
        break;
      
      case 'my_agenda':
        // Show only services where the leader is "Armando Noel"
        filtered = services.filter(service => 
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
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'my_agenda': return 'Mi Agenda';
      case 'all': return 'Todos los Servicios';
      default: return 'Filtro';
    }
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
              variant={filter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('week')}
            >
              Esta Semana
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
                ? "No tienes servicios asignados en este período." 
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

      {/* Choir Breaks Card */}
      {filteredServices.some(s => s.choir_breaks) && (
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
