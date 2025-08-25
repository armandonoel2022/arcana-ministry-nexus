import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Clock, Calendar, Users, Music, AlertTriangle, MessageSquare } from "lucide-react";

interface ServiceNotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata?: {
      service_date?: string;
      month_order?: string;
      special_event?: string;
      services?: Array<{
        time: string;
        director: { name: string; photo: string };
        group: string;
        voices: Array<{ name: string; photo: string }>;
      }>;
    };
  };
  onDismiss: () => void;
}

const ServiceNotificationCard: React.FC<ServiceNotificationCardProps> = ({
  notification,
  onDismiss
}) => {
  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className="fixed top-4 right-4 w-[500px] z-50 shadow-2xl border-l-4 border-l-primary bg-white max-h-[90vh] overflow-y-auto">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-blue-800">
                  Programa de Servicios
                </h3>
                <p className="text-blue-600 font-medium">
                  {notification.metadata?.month_order}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Date and Event Info */}
          <div className="text-center space-y-3 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">
                {notification.metadata?.service_date && formatDate(notification.metadata.service_date)}
              </span>
            </div>
            {notification.metadata?.special_event && (
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
                <span className="text-lg">🎉</span>
                <span className="font-medium">{notification.metadata.special_event}</span>
              </div>
            )}
          </div>
          
          {/* Services */}
          {notification.metadata?.services && notification.metadata.services.map((service, index) => (
            <div key={index} className="border-2 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-blue-50 border-blue-200">
              {/* Time */}
              <div className="flex items-center gap-3 mb-5">
                <Clock className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-2xl text-blue-800">{service.time}</span>
              </div>
              
              {/* Director Section */}
              <div className="flex items-center gap-4 mb-5 p-4 bg-white rounded-lg border-2 border-blue-100">
                <Avatar className="w-16 h-16 border-3 border-blue-400 shadow-lg">
                  <AvatarImage src={service.director.photo} alt={service.director.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg">
                    {getInitials(service.director.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-800 text-lg">Dirige:</span>
                    <span className="font-bold text-xl text-blue-900">{service.director.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">Grupo Asignado: {service.group}</span>
                  </div>
                </div>
              </div>
              
              {/* Voices Section */}
              <div className="bg-white rounded-lg p-4 border-2 border-blue-100">
                <p className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Responsables de voces:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {service.voices.map((voice, voiceIndex) => (
                    <div key={voiceIndex} className="flex items-center gap-3 bg-blue-50 rounded-lg px-3 py-3 border border-blue-200">
                      <Avatar className="w-10 h-10 border-2 border-blue-300">
                        <AvatarImage src={voice.photo} alt={voice.name} />
                        <AvatarFallback className="text-sm bg-blue-200 text-blue-800 font-semibold">
                          {getInitials(voice.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-gray-700 truncate">{voice.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {/* Warning */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-orange-800 font-medium">
              <strong>En caso de no poder asistir,</strong> cada responsable de voz debe gestionar su propio suplente.
            </p>
          </div>
          
          {/* Footer */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <p className="text-blue-800 font-medium">
              ¡Este es un servicio de mensajes automatizado, no es necesario responder! 🙌
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceNotificationCard;