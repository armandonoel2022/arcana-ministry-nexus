
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BotResponse {
  type: 'turnos' | 'ensayos' | 'canciones' | 'general';
  message: string;
}

export class ArcanaBot {
  private static readonly BOT_USER_ID = 'arcana-bot';
  
  static async processMessage(message: string, roomId: string, userId: string): Promise<BotResponse | null> {
    // Verificar si el mensaje menciona a ARCANA
    const mentionsBot = message.toLowerCase().includes('@arcana') || 
                       message.toLowerCase().startsWith('arcana:');
    
    if (!mentionsBot) return null;

    // Limpiar el mensaje removiendo la mención y signos de puntuación
    const cleanMessage = message
      .replace(/@arcana\s*:?/gi, '')
      .replace(/^arcana\s*:?/gi, '')
      .replace(/^\s*:\s*/, '') // Remover dos puntos iniciales
      .trim()
      .toLowerCase();

    console.log('ARCANA procesando mensaje limpio:', cleanMessage);

    // Analizar el tipo de consulta
    if (this.isTurnosQuery(cleanMessage)) {
      return await this.handleTurnosQuery(userId);
    } else if (this.isEnsayosQuery(cleanMessage)) {
      return await this.handleEnsayosQuery();
    } else if (this.isCancionesQuery(cleanMessage)) {
      return await this.handleCancionesQuery(cleanMessage);
    } else {
      return this.handleGeneralQuery(cleanMessage);
    }
  }

  private static isTurnosQuery(message: string): boolean {
    const turnosKeywords = ['turno', 'turnos', 'cantar', 'cuando me toca', 'próximo turno', 'agenda', 'toca'];
    return turnosKeywords.some(keyword => message.includes(keyword));
  }

  private static isEnsayosQuery(message: string): boolean {
    const ensayosKeywords = ['ensayo', 'ensayos', 'práctica', 'practicas', 'rehearsal'];
    return ensayosKeywords.some(keyword => message.includes(keyword));
  }

  private static isCancionesQuery(message: string): boolean {
    const cancionesKeywords = ['canción', 'cancion', 'canciones', 'buscar', 'repertorio', 'música', 'song'];
    return cancionesKeywords.some(keyword => message.includes(keyword));
  }

  private static async handleTurnosQuery(userId: string): Promise<BotResponse> {
    try {
      // Buscar información del usuario en perfiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (!profile) {
        return {
          type: 'turnos',
          message: '🤖 No pude encontrar tu perfil. Asegúrate de tener tu información actualizada en el sistema.'
        };
      }

      // Buscar próximos eventos en la agenda ministerial
      const today = new Date().toISOString().split('T')[0];
      const { data: eventos } = await supabase
        .from('services')
        .select('*')
        .gte('service_date', today)
        .order('service_date', { ascending: true })
        .limit(5);

      if (!eventos || eventos.length === 0) {
        return {
          type: 'turnos',
          message: '🤖 No hay servicios próximos programados en la agenda ministerial.'
        };
      }

      // Buscar si el usuario está mencionado en algún evento
      const eventosConUsuario = eventos.filter(evento => 
        evento.leader?.toLowerCase().includes(profile.full_name.toLowerCase()) ||
        evento.description?.toLowerCase().includes(profile.full_name.toLowerCase()) ||
        evento.notes?.toLowerCase().includes(profile.full_name.toLowerCase())
      );

      if (eventosConUsuario.length === 0) {
        return {
          type: 'turnos',
          message: `🤖 Hola ${profile.full_name}! No tienes turnos programados en los próximos servicios. Consulta con tu líder de grupo para más información.`
        };
      }

      const proximoEvento = eventosConUsuario[0];
      const fecha = new Date(proximoEvento.service_date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return {
        type: 'turnos',
        message: `🎵 ¡Hola ${profile.full_name}! Tu próximo turno es:\n\n📅 **${proximoEvento.title}**\n🗓️ ${fecha}\n📍 ${proximoEvento.location || 'Ubicación por confirmar'}\n\n¡Prepárate para alabar al Señor! 🙏`
      };

    } catch (error) {
      console.error('Error consultando turnos:', error);
      return {
        type: 'turnos',
        message: '🤖 Disculpa, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.'
      };
    }
  }

  private static async handleEnsayosQuery(): Promise<BotResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: ensayos } = await supabase
        .from('services')
        .select('*')
        .gte('service_date', today)
        .ilike('title', '%ensayo%')
        .order('service_date', { ascending: true })
        .limit(3);

      if (!ensayos || ensayos.length === 0) {
        return {
          type: 'ensayos',
          message: '🤖 No hay ensayos programados próximamente. Mantente atento a los anuncios del ministerio.'
        };
      }

      let mensaje = '🎵 **Próximos Ensayos:**\n\n';
      ensayos.forEach((ensayo, index) => {
        const fecha = new Date(ensayo.service_date).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
        mensaje += `${index + 1}. **${ensayo.title}**\n📅 ${fecha}\n📍 ${ensayo.location || 'Ubicación por confirmar'}\n\n`;
      });

      mensaje += '¡No faltes! La alabanza requiere preparación. 🙏';

      return {
        type: 'ensayos',
        message: mensaje
      };

    } catch (error) {
      console.error('Error consultando ensayos:', error);
      return {
        type: 'ensayos',
        message: '🤖 Disculpa, hubo un error consultando los ensayos. Revisa la agenda ministerial directamente.'
      };
    }
  }

  private static async handleCancionesQuery(query: string): Promise<BotResponse> {
    try {
      // Extraer términos de búsqueda
      const searchTerms = query
        .replace(/canción|cancion|canciones|buscar|repertorio|música|song/gi, '')
        .trim();

      if (!searchTerms) {
        return {
          type: 'canciones',
          message: '🤖 Para buscar canciones, especifica el nombre o categoría. Ejemplo: "@ARCANA buscar alabanza" o "@ARCANA canción espíritu santo"'
        };
      }

      const { data: canciones } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${searchTerms}%,artist.ilike.%${searchTerms}%,genre.ilike.%${searchTerms}%`)
        .limit(5);

      if (!canciones || canciones.length === 0) {
        return {
          type: 'canciones',
          message: `🤖 No encontré canciones con "${searchTerms}". Puedes buscar por título, artista o género en nuestro repertorio.`
        };
      }

      let mensaje = `🎵 **Encontré ${canciones.length} canción(es) con "${searchTerms}":**\n\n`;
      canciones.forEach((cancion, index) => {
        mensaje += `${index + 1}. **${cancion.title}**\n`;
        if (cancion.artist) mensaje += `🎤 ${cancion.artist}\n`;
        if (cancion.genre) mensaje += `🎼 ${cancion.genre}\n`;
        if (cancion.key_signature) mensaje += `🎹 Tono: ${cancion.key_signature}\n`;
        mensaje += '\n';
      });

      return {
        type: 'canciones',
        message: mensaje
      };

    } catch (error) {
      console.error('Error buscando canciones:', error);
      return {
        type: 'canciones',
        message: '🤖 Disculpa, hubo un error buscando canciones. Consulta directamente el repertorio musical.'
      };
    }
  }

  private static handleGeneralQuery(query: string): BotResponse {
    // Respuestas predefinidas para consultas generales relacionadas con el ministerio
    const responses = {
      'valores': '🤖 Nuestros valores fundamentales son: **Fe, Adoración, Comunidad, Servicio y Excelencia**. Cada integrante del ministerio debe reflejar estos valores en su vida y servicio.',
      'horarios': '🤖 Los horarios regulares son: Ensayos los miércoles 7:00 PM, Servicio domingo 9:00 AM. Para horarios específicos, consulta la agenda ministerial.',
      'contacto': '🤖 Para contactar a los líderes del ministerio, puedes usar este sistema de comunicación o consultar en la sección de Integrantes.',
      'ayuda': '🤖 Puedo ayudarte con:\n• Consultar turnos: "@ARCANA cuándo me toca cantar"\n• Ver ensayos: "@ARCANA próximos ensayos"\n• Buscar canciones: "@ARCANA buscar [nombre/género]"\n• Información general del ministerio'
    };

    // Buscar coincidencias en las consultas
    for (const [key, response] of Object.entries(responses)) {
      if (query.includes(key)) {
        return { type: 'general', message: response };
      }
    }

    // Respuesta por defecto
    return {
      type: 'general',
      message: '🤖 Hola! Soy ARCANA, el asistente del Ministerio ADN. Puedo ayudarte con consultas sobre turnos, ensayos y canciones. Escribe "@ARCANA ayuda" para ver todas mis funciones.'
    };
  }

  static async sendBotResponse(roomId: string, response: BotResponse): Promise<void> {
    try {
      await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: this.BOT_USER_ID,
          message: response.message,
          is_bot: true
        });
    } catch (error) {
      console.error('Error enviando respuesta del bot:', error);
    }
  }
}
