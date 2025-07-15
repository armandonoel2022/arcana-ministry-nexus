import { supabase } from "@/integrations/supabase/client";

interface BotResponse {
  type: 'turnos' | 'ensayos' | 'canciones' | 'general';
  message: string;
}

export class ArcanaBot {
  // Remove the BOT_USER_ID since we'll use null instead
  
  static async processMessage(message: string, roomId: string, userId: string): Promise<BotResponse | null> {
    // Verificar si el mensaje menciona a ARCANA (más flexible)
    const mentionsBot = message.toLowerCase().includes('arcana') || 
                       message.toLowerCase().includes('@arcana');
    
    if (!mentionsBot) {
      console.log('ARCANA: Mensaje no contiene mención');
      return null;
    }

    // Limpiar el mensaje removiendo menciones y signos de puntuación
    const cleanMessage = message
      .replace(/@arcana\s*:?/gi, '')
      .replace(/arcana\s*:?/gi, '')
      .replace(/^\s*:\s*/, '')
      .trim()
      .toLowerCase();

    console.log('ARCANA procesando mensaje limpio:', cleanMessage);

    // Si el mensaje limpio está vacío, dar respuesta de ayuda
    if (!cleanMessage) {
      console.log('ARCANA: Mensaje vacío después de limpiar, mostrando ayuda');
      return this.handleGeneralQuery('ayuda');
    }

    // Analizar el tipo de consulta
    if (this.isTurnosQuery(cleanMessage)) {
      console.log('ARCANA detectó consulta de turnos');
      // Verificar si está preguntando por otro usuario
      const otherUser = this.extractUserFromQuery(cleanMessage);
      if (otherUser) {
        return await this.handleTurnosQueryForUser(otherUser);
      } else {
        return await this.handleTurnosQuery(userId);
      }
    } else if (this.isEnsayosQuery(cleanMessage)) {
      console.log('ARCANA detectó consulta de ensayos');
      return await this.handleEnsayosQuery();
    } else if (this.isCancionesQuery(cleanMessage)) {
      console.log('ARCANA detectó consulta de canciones');
      return await this.handleCancionesQuery(cleanMessage);
    } else {
      console.log('ARCANA detectó consulta general');
      return this.handleGeneralQuery(cleanMessage);
    }
  }

  private static extractUserFromQuery(message: string): string | null {
    // Buscar patrones como "turno de [nombre]", "cuando le toca a [nombre]", etc.
    const patterns = [
      /(?:turno\s+de|turnos?\s+de|cuando\s+le\s+toca\s+a?|toca\s+a)\s+([a-záéíóúñ\s]+)/i,
      /([a-záéíóúñ\s]+)\s+(?:turno|turnos|toca|cantar)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        // Validar que no sea una palabra común que podría causar falsos positivos
        const commonWords = ['me', 'mi', 'cuando', 'que', 'el', 'la', 'un', 'una', 'este', 'esta'];
        if (!commonWords.includes(extractedName.toLowerCase()) && extractedName.length > 2) {
          console.log('ARCANA extrajo nombre:', extractedName);
          return extractedName;
        }
      }
    }
    
    return null;
  }

  private static async handleTurnosQueryForUser(userName: string): Promise<BotResponse> {
    try {
      console.log('ARCANA consultando turnos para otro usuario:', userName);
      
      // Buscar el usuario en la tabla members por nombre
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('nombres, apellidos')
        .or(`nombres.ilike.%${userName}%,apellidos.ilike.%${userName}%`)
        .limit(5);

      if (membersError) {
        console.error('Error buscando miembros:', membersError);
        return {
          type: 'turnos',
          message: '🤖 Hubo un error buscando información del integrante.'
        };
      }

      if (!members || members.length === 0) {
        return {
          type: 'turnos',
          message: `🤖 No encontré ningún integrante con el nombre "${userName}". Verifica el nombre e intenta nuevamente.`
        };
      }

      // Si hay múltiples coincidencias, usar la primera
      const member = members[0];
      const fullName = `${member.nombres} ${member.apellidos}`;
      
      if (members.length > 1) {
        const nombres = members.map(m => `${m.nombres} ${m.apellidos}`).join(', ');
        return {
          type: 'turnos',
          message: `🤖 Encontré varios integrantes: ${nombres}. Por favor especifica mejor el nombre.`
        };
      }

      return await this.searchUserInServices(fullName);

    } catch (error) {
      console.error('Error consultando turnos para otro usuario:', error);
      return {
        type: 'turnos',
        message: '🤖 Disculpa, hubo un error consultando los turnos del integrante.'
      };
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
      console.log('ARCANA consultando turnos para usuario:', userId);
      
      // Buscar información del usuario en perfiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.log('No se encontró perfil, buscando en tabla members');
        
        // Buscar en la tabla members usando el email del usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          return {
            type: 'turnos',
            message: '🤖 No pude identificar tu usuario. Asegúrate de estar autenticado correctamente.'
          };
        }

        // Buscar en members por email
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('nombres, apellidos')
          .eq('email', user.email)
          .single();

        if (memberError || !member) {
          return {
            type: 'turnos',
            message: '🤖 No encontré tu información en el sistema de integrantes. Contacta a tu líder para actualizar tus datos.'
          };
        }

        // Usar el nombre completo del member
        const fullName = `${member.nombres} ${member.apellidos}`;
        return await this.searchUserInServices(fullName);
      }

      // Usar el nombre del perfil
      return await this.searchUserInServices(profile.full_name);

    } catch (error) {
      console.error('Error consultando turnos:', error);
      return {
        type: 'turnos',
        message: '🤖 Disculpa, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.'
      };
    }
  }

  private static async searchUserInServices(fullName: string): Promise<BotResponse> {
    try {
      console.log('Buscando servicios para:', fullName);

      // Buscar próximos eventos en la agenda ministerial (ampliar rango para incluir más fechas)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const { data: eventos, error: eventosError } = await supabase
        .from('services')
        .select('*')
        .gte('service_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('service_date', { ascending: true })
        .limit(50);

      if (eventosError) {
        console.error('Error consultando eventos:', eventosError);
        return {
          type: 'turnos',
          message: '🤖 Hubo un error consultando la agenda ministerial. Intenta nuevamente.'
        };
      }

      console.log('Eventos encontrados:', eventos?.length || 0);
      console.log('Buscando nombre completo:', fullName);

      if (!eventos || eventos.length === 0) {
        return {
          type: 'turnos',
          message: '🤖 No hay servicios programados en la agenda ministerial.'
        };
      }

      // Mejorar la búsqueda del usuario en los eventos
      const eventosConUsuario = eventos.filter(evento => {
        // Crear un texto de búsqueda más amplio
        const searchableFields = [
          evento.leader || '',
          evento.description || '',
          evento.notes || '',
          evento.title || '',
          evento.special_activity || '',
          evento.choir_breaks || ''
        ];
        
        const searchableText = searchableFields.join(' ').toLowerCase();
        console.log(`Evento ${evento.title}: buscando en "${searchableText}"`);
        
        // Dividir el nombre en partes para búsqueda más flexible
        const nombresParts = fullName.toLowerCase().split(' ');
        const firstNames = nombresParts.slice(0, 2); // Primeros dos nombres
        const lastNames = nombresParts.slice(2); // Apellidos
        
        // Buscar coincidencias más flexibles
        const hasFirstName = firstNames.some(part => 
          part.length > 2 && searchableText.includes(part)
        );
        
        const hasLastName = lastNames.some(part => 
          part.length > 2 && searchableText.includes(part)
        );
        
        // También buscar el nombre completo directo
        const hasFullName = searchableText.includes(fullName.toLowerCase());
        
        const found = hasFirstName || hasLastName || hasFullName;
        if (found) {
          console.log(`✓ Encontrado en evento: ${evento.title} - ${evento.service_date}`);
        }
        
        return found;
      });

      // Filtrar solo eventos futuros de los encontrados
      const today_str = today.toISOString().split('T')[0];
      const eventosFuturos = eventosConUsuario.filter(evento => 
        evento.service_date >= today_str
      );

      console.log('Eventos con usuario (todos):', eventosConUsuario.length);
      console.log('Eventos futuros con usuario:', eventosFuturos.length);

      if (eventosFuturos.length === 0 && eventosConUsuario.length > 0) {
        // Hay eventos pasados pero no futuros
        const ultimoEvento = eventosConUsuario[eventosConUsuario.length - 1];
        const fecha = new Date(ultimoEvento.service_date).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        return {
          type: 'turnos',
          message: `🎵 Hola ${fullName}! Tu último turno registrado fue:\n\n📅 **${ultimoEvento.title}**\n🗓️ ${fecha}\n📍 ${ultimoEvento.location || 'Ubicación por confirmar'}\n\n💡 No tienes turnos futuros programados. Consulta con tu líder de grupo para próximos servicios.`
        };
      }

      if (eventosFuturos.length === 0) {
        return {
          type: 'turnos',
          message: `🤖 Hola ${fullName}! No encontré turnos programados para ti en los próximos servicios. Consulta con tu líder de grupo para más información.`
        };
      }

      // Mostrar el próximo evento futuro
      const proximoEvento = eventosFuturos[0];
      const fecha = new Date(proximoEvento.service_date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let mensaje = `🎵 ¡Hola ${fullName}! Tu próximo turno es:\n\n📅 **${proximoEvento.title}**\n🗓️ ${fecha}\n📍 ${proximoEvento.location || 'Ubicación por confirmar'}`;
      
      // Agregar información adicional si está disponible
      if (proximoEvento.special_activity) {
        mensaje += `\n🎯 Actividad: ${proximoEvento.special_activity}`;
      }
      
      if (proximoEvento.notes) {
        mensaje += `\n📝 Notas: ${proximoEvento.notes}`;
      }
      
      mensaje += '\n\n¡Prepárate para alabar al Señor! 🙏';
      
      // Si hay más turnos futuros, mencionarlo
      if (eventosFuturos.length > 1) {
        mensaje += `\n\n💡 Tienes ${eventosFuturos.length - 1} turno(s) adicional(es) programado(s).`;
      }

      return {
        type: 'turnos',
        message: mensaje
      };

    } catch (error) {
      console.error('Error buscando en servicios:', error);
      return {
        type: 'turnos',
        message: '🤖 Disculpa, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.'
      };
    }
  }

  private static async handleEnsayosQuery(): Promise<BotResponse> {
    try {
      console.log('ARCANA consultando ensayos - respuesta fija para viernes');
      
      // Obtener la fecha actual
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Domingo, 5 = Viernes
      
      let nextFriday: Date;
      
      if (currentDay === 5) {
        // Si hoy es viernes, usar la fecha de hoy
        nextFriday = today;
      } else {
        // Calcular el próximo viernes
        const daysUntilFriday = (5 - currentDay + 7) % 7;
        nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
      }
      
      // Formatear la fecha en español
      const fechaEnsayo = nextFriday.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mensaje = `🎵 **Próximo Ensayo:**\n\n📅 ${fechaEnsayo}\n⏰ 07:00 p.m. a 09:00 p.m.\n📍 Ubicación habitual de ensayo\n\n¡No faltes! La alabanza requiere preparación. 🙏`;

      return {
        type: 'ensayos',
        message: mensaje
      };

    } catch (error) {
      console.error('Error generando respuesta de ensayos:', error);
      return {
        type: 'ensayos',
        message: '🤖 Disculpa, hubo un error consultando los ensayos. Los ensayos son todos los viernes de 07:00 p.m. a 09:00 p.m.'
      };
    }
  }

  private static async handleCancionesQuery(query: string): Promise<BotResponse> {
    try {
      console.log('ARCANA consultando canciones con query:', query);
      
      // Extraer términos de búsqueda
      const searchTerms = query
        .replace(/canción|cancion|canciones|buscar|repertorio|música|song/gi, '')
        .trim();

      if (!searchTerms) {
        return {
          type: 'canciones',
          message: '🤖 Para buscar canciones, especifica el nombre o categoría. Ejemplo: "ARCANA buscar alabanza" o "ARCANA canción espíritu santo"'
        };
      }

      const { data: canciones, error } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${searchTerms}%,artist.ilike.%${searchTerms}%,genre.ilike.%${searchTerms}%`)
        .limit(5);

      if (error) {
        console.error('Error buscando canciones:', error);
        return {
          type: 'canciones',
          message: '🤖 Disculpa, hubo un error buscando canciones. Consulta directamente el repertorio musical.'
        };
      }

      console.log('Canciones encontradas:', canciones?.length || 0);

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
    console.log('ARCANA manejando consulta general:', query);
    
    // Respuestas predefinidas para consultas generales relacionadas con el ministerio
    const responses = {
      'valores': '🤖 Nuestros valores fundamentales son: **Fe, Adoración, Comunidad, Servicio y Excelencia**. Cada integrante del ministerio debe reflejar estos valores en su vida y servicio.',
      'horarios': '🤖 Los horarios regulares son: Ensayos los miércoles 7:00 PM, Servicio domingo 9:00 AM. Para horarios específicos, consulta la agenda ministerial.',
      'contacto': '🤖 Para contactar a los líderes del ministerio, puedes usar este sistema de comunicación o consultar en la sección de Integrantes.',
      'ayuda': '🤖 Puedo ayudarte con:\n• Consultar turnos: "ARCANA cuándo me toca cantar"\n• Turnos de otros: "ARCANA turno de [nombre]" o "ARCANA cuándo le toca a [nombre]"\n• Ver ensayos: "ARCANA próximos ensayos"\n• Buscar canciones: "ARCANA buscar [nombre/género]"\n• Información general del ministerio\n\n💡 Puedes escribir "ARCANA" o "@ARCANA" seguido de tu consulta.'
    };

    // Buscar coincidencias en las consultas
    for (const [key, response] of Object.entries(responses)) {
      if (query.includes(key)) {
        console.log('ARCANA encontró respuesta para:', key);
        return { type: 'general', message: response };
      }
    }

    // Respuesta por defecto
    console.log('ARCANA usando respuesta por defecto');
    return {
      type: 'general',
      message: '🤖 Hola! Soy ARCANA, el asistente del Ministerio ADN. Puedo ayudarte con consultas sobre turnos, ensayos y canciones. Escribe "ARCANA ayuda" para ver todas mis funciones.'
    };
  }

  static async sendBotResponse(roomId: string, response: BotResponse): Promise<void> {
    try {
      console.log('ARCANA enviando respuesta:', response.message.substring(0, 50) + '...');
      
      // Usar user_id null para el bot
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          user_id: null, // Bot messages will have null user_id
          message: response.message,
          is_bot: true,
          message_type: 'text',
          is_deleted: false
        }]);

      if (error) {
        console.error('Error enviando respuesta del bot:', error);
        throw error;
      }

      console.log('ARCANA respuesta enviada exitosamente');
    } catch (error) {
      console.error('Error enviando respuesta del bot:', error);
    }
  }
}
