import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar, MapPin, Clock, Church, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import arcanaLogo from '@/assets/arca-noe-logo.png';
import { supabase } from '@/integrations/supabase/client';

interface SpecialEventOverlayProps {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  description?: string;
  eventType?: string;
  autoFetch?: boolean; // If true, fetch the next event from DB
  onClose: () => void;
}

const SpecialEventOverlay: React.FC<SpecialEventOverlayProps> = ({
  eventName: propEventName,
  eventDate: propEventDate,
  eventTime: propEventTime,
  location: propLocation,
  description: propDescription,
  eventType: propEventType = 'special',
  autoFetch = false,
  onClose,
}) => {
  const [eventData, setEventData] = useState<{
    eventName: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    description?: string;
    eventType?: string;
  } | null>(null);
  const [loading, setLoading] = useState(autoFetch);

  useEffect(() => {
    if (autoFetch) {
      fetchNextEvent();
    }
  }, [autoFetch]);

  const fetchNextEvent = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setEventData({
          eventName: data.title,
          eventDate: data.event_date,
          eventTime: data.event_date?.split('T')[1]?.slice(0, 5) || undefined,
          location: data.location || undefined,
          description: data.description || undefined,
          eventType: data.event_type || 'special',
        });
      }
    } catch (error) {
      console.error('Error fetching next event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use fetched data or props
  const eventName = eventData?.eventName || propEventName || 'Evento Especial';
  const eventDate = eventData?.eventDate || propEventDate || '';
  const eventTime = eventData?.eventTime || propEventTime;
  const location = eventData?.location || propLocation;
  const description = eventData?.description || propDescription;
  const eventType = eventData?.eventType || propEventType;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }
  // Parse and format date safely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Fecha por confirmar';
      }
      return format(date, "EEEE, dd 'de' MMMM yyyy", { locale: es });
    } catch {
      return 'Fecha por confirmar';
    }
  };

  const formattedDate = formatDate(eventDate);

  const getEventIcon = () => {
    switch (eventType) {
      case 'celebration':
      case 'anniversary':
        return <PartyPopper className="w-10 h-10 text-white" />;
      case 'worship':
      case 'service':
        return <Church className="w-10 h-10 text-white" />;
      default:
        return <Calendar className="w-10 h-10 text-white" />;
    }
  };

  const getGradient = () => {
    switch (eventType) {
      case 'celebration':
      case 'anniversary':
        return 'from-purple-500 via-purple-600 to-purple-700';
      case 'worship':
      case 'service':
        return 'from-indigo-500 via-indigo-600 to-indigo-700';
      default:
        return 'from-emerald-500 via-emerald-600 to-emerald-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-md bg-gradient-to-b ${getGradient()} rounded-3xl shadow-2xl relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2" />
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/80 hover:text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <img src={arcanaLogo} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Evento Especial</p>
            </div>
          </div>

          {/* Event icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
              {getEventIcon()}
            </div>
          </div>

          {/* Event name */}
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight">
            {eventName}
          </h2>
        </div>

        {/* Event details card */}
        <div className="px-6">
          <div className="bg-white/90 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-semibold text-gray-800 capitalize">{formattedDate}</p>
              </div>
            </div>

            {/* Time */}
            {eventTime && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="font-semibold text-gray-800">{eventTime}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lugar</p>
                  <p className="font-semibold text-gray-800">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="px-6 mt-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-white/90 text-center leading-relaxed">{description}</p>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="p-6 pt-6">
          <Button
            onClick={onClose}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 py-6 text-lg font-semibold rounded-xl shadow-lg backdrop-blur-sm"
          >
            ¡Entendido!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpecialEventOverlay;
