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
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-xl border-2 max-w-4xl">
      <CardContent className="p-6">
        {/* Header con botón de cierre */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold text-blue-800">
                Programa de Servicios - 4to Domingo de Agosto
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span className="font-medium text-blue-700">24 de Agosto de 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📌</span>
                  <span className="font-medium text-blue-700">4to Domingo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <span className="font-bold text-purple-700">Culto Misionero</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Servicios */}
        <div className="space-y-6">
          {sampleServices.map((service, serviceIndex) => (
            <div key={serviceIndex} className="bg-white rounded-lg border border-blue-200 p-6 shadow-md">
              {/* Horario */}
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-2xl text-blue-800">{service.time}</span>
              </div>
              
              {/* Director principal con foto más grande */}
              <div className="flex items-center gap-6 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <Avatar className="w-20 h-20 border-4 border-blue-300 shadow-lg">
                  <AvatarImage
                    src={service.director?.photo_url || undefined}
                    alt={`${service.director?.nombres} ${service.director?.apellidos}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                    {service.director ? getInitials(`${service.director.nombres} ${service.director.apellidos}`) : 'D'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-800">Dirige:</span>
                    <span className="font-bold text-xl text-blue-900">
                      {service.director ? `${service.director.nombres} ${service.director.apellidos}` : 'Director Asignado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎶</span>
                    <span className="text-blue-700 font-medium">Grupo Asignado: Grupo Principal</span>
                  </div>
                </div>
              </div>

              {/* Responsables de voces */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-800">Responsables de voces:</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {service.members.map((member, memberIndex) => (
                    <div key={memberIndex} className="text-center bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <Avatar className="w-14 h-14 mx-auto mb-2 border-2 border-blue-200">
                        <AvatarImage
                          src={member.photo_url || undefined}
                          alt={`${member.nombres} ${member.apellidos}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white font-bold text-sm">
                          {getInitials(`${member.nombres} ${member.apellidos}`)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-semibold text-blue-900">
                        {member.nombres}
                      </p>
                      <p className="text-xs text-blue-600">
                        {member.apellidos}
                      </p>
                      {member.voz_instrumento && (
                        <p className="text-xs text-gray-500 mt-1">
                          {member.voz_instrumento}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aviso importante */}
        <div className="mt-6 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 text-orange-600 text-lg flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-orange-800 font-medium">
              <strong>Importante:</strong> En caso de no poder asistir, cada responsable de voz debe gestionar su propio suplente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-center border border-blue-200">
          <div className="flex items-center justify-center gap-2">
            <Music className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800 font-medium">
              ¡Este es un servicio de mensajes automatizado, no es necesario responder! 
            </p>
            <span className="text-xl">🙌</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceNotificationCard;