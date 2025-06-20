
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
  id: string;
  title: string;
  service_date: string;
  location: string;
  description: string;
  leader: string;
  service_type: string;
  special_activity: string;
  notes: string;
}

type FilterType = 'current_weekend' | 'all';

const EventosEspeciales = () => {
  const [eventos, setEventos] = useState<Service[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('current_weekend');

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [eventos, filter]);

  const fetchEventos = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .gte('service_date', today)
        .ilike('leader', '%TODOS%')
        .order('service_date', { ascending: true });

      if (error) {
        console.error('Error fetching eventos:', error);
      } else {
        setEventos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...eventos];

    switch (filter) {
      case 'current_weekend':
        // Show services from Friday to Sunday of current week
        const weekStart = startOfWeek(now, { weekStartsOn: 5 }); // Friday
        const weekEnd = endOfWeek(now, { weekStartsOn: 5 }); // Sunday
        filtered = eventos.filter(evento => 
          isWithinInterval(new Date(evento.service_date), { start: weekStart, end: weekEnd })
        );
        break;
      
      case 'all':
      default:
        filtered = eventos;
        break;
    }

    setFilteredEventos(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case 'current_weekend': return 'Actividades de la Semana';
      case 'all': return 'Todas las Actividades';
      default: return 'Filtro';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold arcana-gradient-text">Eventos Especiales</h1>
            <p className="text-gray-600">Todas las actividades donde participamos juntos</p>
          </div>
        </div>
        <div className="text-center">Cargando eventos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold arcana-gradient-text">Eventos Especiales</h1>
          <p className="text-gray-600">Todas las actividades donde participamos juntos</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros de Vista
          </CardTitle>
          <CardDescription>
            Seleccione el período de eventos que desea visualizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'current_weekend' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('current_weekend')}
            >
              Actividades de la Semana
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas las Actividades
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            {getFilterLabel(filter)} ({filteredEventos.length} eventos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEventos.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {filter === 'current_weekend' 
                ? "No hay eventos especiales programados para esta semana." 
                : "No hay eventos especiales próximos programados."}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEventos.map((evento) => (
                <Card key={evento.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-arcana-blue-600" />
                      {evento.title}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(evento.service_date)} • {formatTime(evento.service_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {evento.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {evento.location}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      Participación: {evento.leader}
                    </div>

                    {evento.description && (
                      <p className="text-sm text-gray-700">{evento.description}</p>
                    )}

                    {evento.special_activity && (
                      <div className="bg-arcana-gold-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-arcana-gold-700 mb-1">Actividad Especial:</h4>
                        <p className="text-sm text-arcana-gold-600">{evento.special_activity}</p>
                      </div>
                    )}

                    {evento.notes && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-blue-700 mb-1">Notas:</h4>
                        <p className="text-sm text-blue-600">{evento.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {eventos.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No hay eventos especiales próximos
          </h3>
          <p className="text-gray-500">
            Mantente atento a los anuncios del ministerio
          </p>
        </div>
      )}
    </div>
  );
};

export default EventosEspeciales;
