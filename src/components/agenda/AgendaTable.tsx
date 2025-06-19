
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
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
}

export const AgendaTable: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          worship_groups (
            name,
            color_theme
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Cargando servicios...</div>
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No hay servicios programados. Agregue el primer servicio usando la pestaña "Agregar Servicio".
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
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

      {services.some(s => s.choir_breaks) && (
        <Card>
          <CardHeader>
            <CardTitle>Descansos de los Coros</CardTitle>
            <CardDescription>
              Información sobre descansos programados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {services
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
