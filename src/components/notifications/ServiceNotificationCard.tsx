import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Clock, Calendar, Users, Music } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface ServiceNotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata: {
      service_date?: string;
      month_order?: string;
      special_event?: string;
      services?: Array<{
        time: string;
        director_name: string;
        director_photo?: string;
        group_name: string;
        members: Array<{
          name: string;
          photo?: string;
        }>;
      }>;
    };
  };
  onDismiss: () => void;
}

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  voz_instrumento?: string;
}

const ServiceNotificationCard: React.FC<ServiceNotificationCardProps> = ({
  notification,
  onDismiss
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDirectors = () => {
    return members.filter(member => 
      member.cargo === 'director_alabanza' || member.cargo === 'directora_alabanza'
    );
  };

  const getVocalMembers = () => {
    return members.filter(member => 
      member.voz_instrumento && 
      (member.voz_instrumento.toLowerCase().includes('voz') || 
       member.voz_instrumento.toLowerCase().includes('soprano') ||
       member.voz_instrumento.toLowerCase().includes('alto') ||
       member.voz_instrumento.toLowerCase().includes('tenor') ||
       member.voz_instrumento.toLowerCase().includes('bajo'))
    );
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

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) return null;

  const directors = getDirectors();
  const vocalMembers = getVocalMembers();

  // Crear servicios de ejemplo con datos reales
  const sampleServices = [
    {
      time: "8:00 a.m.",
      director: directors[0] || members[0],
      members: vocalMembers.slice(0, 5)
    },
    {
      time: "10:45 a.m.",
      director: directors[1] || directors[0] || members[1],
      members: vocalMembers.slice(5, 10)
    }
  ];

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 shadow-2xl border-2 max-w-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-purple-800">Programa de Servicios</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Header Info */}
        <div className="bg-white/70 rounded-lg p-4 mb-4 space-y-2">
          <div className="text-lg font-semibold text-purple-800">
            4to Domingo de Agosto
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>24 de Agosto de 2025</span>
            </div>
          </div>
          <div className="text-sm font-medium text-purple-700">
            🎉 Evento especial: Culto Misionero
          </div>
        </div>

        {/* Services */}
        <div className="space-y-6">
          {sampleServices.map((service, index) => (
            <div key={index} className="bg-white/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-800">{service.time}</span>
              </div>
              
              {/* Director */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 border-2 border-purple-300">
                  <AvatarImage
                    src={service.director?.photo_url || undefined}
                    alt={`${service.director?.nombres} ${service.director?.apellidos}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                    {service.director ? getInitials(`${service.director.nombres} ${service.director.apellidos}`) : 'D'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-800">
                    🎤 Dirige: {service.director ? `${service.director.nombres} ${service.director.apellidos}` : 'Director Asignado'}
                  </div>
                  <div className="text-sm text-gray-600">
                    🎶 Grupo Asignado: Grupo Principal
                  </div>
                </div>
              </div>

              {/* Vocal Members */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-700">Responsables de voces:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.members.map((member, idx) => (
                    <div key={idx} className="flex items-center space-x-1 bg-green-50 rounded-lg px-2 py-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={member.photo_url || undefined}
                          alt={`${member.nombres} ${member.apellidos}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                          {getInitials(`${member.nombres} ${member.apellidos}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-green-800">
                        {member.nombres} {member.apellidos}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-amber-600">⚠️</span>
              <span className="text-sm text-amber-800">
                En caso de no poder asistir, cada responsable de voz debe gestionar su propio suplente.
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-purple-600">
              <Music className="w-4 h-4" />
              <span>En espera de la selección de canciones</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              📌 ¡Este es un servicio de mensajes automatizado, no es necesario responder! 🙌
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceNotificationCard;