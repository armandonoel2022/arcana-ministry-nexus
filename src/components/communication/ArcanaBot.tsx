import { supabase } from "@/integrations/supabase/client";

export interface BotAction {
  type: 'select_song';
  songId: string;
  songName: string;
  serviceDate?: string;
  serviceId?: string;
}

interface BotResponse {
  type: "turnos" | "ensayos" | "canciones" | "general";
  message: string;
  expression?: 'thinking' | 'happy' | 'worried';
  actions?: BotAction[];
}

export class ArcanaBot {
  static async processMessage(message: string, roomId: string, userId: string, currentUser?: any): Promise<BotResponse | null> {
    // Detección más flexible de menciones
    const mentionsBot = /arcana|@arcana|bot|asistente/i.test(message);

    if (!mentionsBot) {
      console.log("ARCANA: Mensaje no contiene mención");
      return null;
    }

    // Limpiar mensaje más efectivamente
    const cleanMessage = message
      .replace(/@arcana\s*:?\s*/gi, "")
      .replace(/arcana\s*:?\s*/gi, "")
      .replace(/^(?:bot|asistente)\s*/gi, "")
      .replace(/^\s*[:,-]\s*/, "")
      .trim()
      .toLowerCase();

    console.log("ARCANA procesando mensaje limpio:", cleanMessage);

    // Si está vacío o es saludo
    if (!cleanMessage || /^(hola|hi|hey|buenos|buenas|saludos)/i.test(cleanMessage)) {
      return this.handleGeneralQuery("ayuda");
    }

    // Analizar el tipo de consulta
    if (this.isTurnosQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de turnos");
      console.log("Usuario actual recibido:", currentUser);
      
      // Verificar si está preguntando por otro usuario
      const otherUser = this.extractUserFromQuery(cleanMessage);
      if (otherUser) {
        return await this.handleTurnosQueryForUser(otherUser);
      } else {
        // Pasar el currentUser completo para mejor identificación
        return await this.handleTurnosQuery(userId, currentUser);
      }
    } else if (this.isEnsayosQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de ensayos");
      return await this.handleEnsayosQuery();
    } else if (this.isCancionesQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de canciones");
      return await this.handleCancionesQuery(cleanMessage, userId);
    } else if (this.isSeleccionarCancionQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de selección de canción");
      return await this.handleSeleccionarCancionQuery(cleanMessage);
    } else {
      console.log("ARCANA detectó consulta general");
      return this.handleGeneralQuery(cleanMessage);
    }
  }

  private static extractUserFromQuery(message: string): string | null {
    // Primero verificar si es una consulta propia
    const selfQueryPatterns = [
      /(cuando\s+)?me\s+toca/i,
      /mi\s+(pr[oó]ximo\s+)?turno/i,
      /pr[oó]ximo\s+turno/i,
      /\bme\b.*\btoca\b/i,
      /yo\s+(quiero\s+)?cantar/i,
    ];

    for (const pattern of selfQueryPatterns) {
      if (pattern.test(message)) {
        console.log("ARCANA detectó consulta propia, no buscar otro usuario");
        return null;
      }
    }

    // Patrones mejorados para detectar nombres de otros usuarios
    const patterns = [
      /(?:turno\s+(?:de|para)|le\s+toca\s+a|cuando\s+canta)\s+([a-záéíóúñü\s]{3,})/i,
      /(?:toca\s+a)\s+([a-záéíóúñü\s]{3,})/i,
      /(?:y\s+)?([a-záéíóúñü\s]{3,})\s+(?:cu[áa]ndo\s+le\s+toca|pr[oó]ximo\s+turno)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();

        // Filtrar palabras comunes más exhaustivamente
        const commonWords = [
          "me", "mi", "cuando", "que", "el", "la", "un", "una", "este", "esta", 
          "ese", "esa", "aquel", "aquella", "cantar", "toca", "turno", "próximo", 
          "siguiente", "ensayo", "canción", "cancion", "arcana", "por", "para", 
          "de", "del", "al", "y", "o", "u", "con", "sin", "los", "las",
        ];

        const words = extractedName.toLowerCase().split(/\s+/);
        const isValidName = words.some((word) => word.length > 2 && !commonWords.includes(word));

        if (isValidName && extractedName.length >= 3) {
          console.log("ARCANA extrajo nombre válido:", extractedName);
          return extractedName;
        }
      }
    }

    return null;
  }

  private static async handleTurnosQueryForUser(userName: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando turnos para:", userName);

      // Búsqueda más flexible de miembros
      const searchTerms = userName
        .toLowerCase()
        .split(" ")
        .filter((term) => term.length > 2)
        .map((term) => term.normalize("NFD").replace(/[\u0300-\u036f]/g, "")); // Remover acentos

      let query = supabase.from("members").select("nombres, apellidos, email, cargo, voz_instrumento").eq("is_active", true);

      // Construir condiciones de búsqueda
      const searchConditions = [];
      for (const term of searchTerms) {
        searchConditions.push(`nombres.ilike.%${term}%`);
        searchConditions.push(`apellidos.ilike.%${term}%`);
      }

      const { data: members, error } = await query.or(searchConditions.join(",")).limit(5);

      if (error) throw error;

      if (!members || members.length === 0) {
        return {
          type: "turnos",
          message: `🤖 Lo siento, no encontré al integrante "${userName}" en nuestro sistema.\n\n💡 **Sugerencias:**\n• Verifica la ortografía del nombre\n• Usa nombre y apellido si es posible\n• Consulta la lista de **[Integrantes Activos](/integrantes)**`,
          expression: 'worried',
        };
      }

      // Si hay múltiples coincidencias
      if (members.length > 1) {
        const opciones = members.map((m, i) => `${i + 1}. **${m.nombres} ${m.apellidos}**`).join("\n");

        return {
          type: "turnos",
          message: `🤖 Encontré varios integrantes:\n\n${opciones}\n\n💡 Por favor especifica mejor el nombre. Ejemplo: "ARCANA cuándo le toca a **${members[0].nombres} ${members[0].apellidos.split(" ")[0]}**"`,
          expression: 'thinking',
        };
      }

      // Un solo resultado - buscar en servicios
      const member = members[0];
      const fullName = `${member.nombres} ${member.apellidos}`;
      return await this.searchUserInServices(fullName, member);
    } catch (error) {
      console.error("Error consultando turnos para otro usuario:", error);
      return {
        type: "turnos",
        message:
          "🤖 Lo siento, hubo un error consultando los turnos. Por favor intenta nuevamente o consulta la agenda ministerial directamente.\n\n🔗 **[Ver Agenda Ministerial](/agenda)**",
        expression: 'worried',
      };
    }
  }

  private static isTurnosQuery(message: string): boolean {
    const turnosPatterns = [
      /turno/,
      /cu[áa]ndo\s+(?:me\s+)?toca/,
      /pr[oó]ximo\s+turno/,
      /cu[áa]ndo\s+canto/,
      /me\s+toca\s+cantar/,
      /cu[áa]ndo\s+me\s+toca\s+cantar/,
      /agenda\s+personal/,
      /mis\s+turnos/,
    ];

    return turnosPatterns.some((pattern) => pattern.test(message));
  }

  private static isEnsayosQuery(message: string): boolean {
    const ensayosKeywords = ["ensayo", "ensayos", "práctica", "practicas", "rehearsal"];
    return ensayosKeywords.some((keyword) => message.includes(keyword));
  }

  private static isCancionesQuery(message: string): boolean {
    const cancionesKeywords = ["canción", "cancion", "canciones", "buscar", "repertorio", "música", "song"];
    return cancionesKeywords.some((keyword) => message.includes(keyword));
  }

  private static isSeleccionarCancionQuery(message: string): boolean {
    const seleccionKeywords = ["seleccionar", "elegir", "añadir", "agregar", "para servicio", "para próximo servicio"];
    const hasSeleccionKeyword = seleccionKeywords.some((keyword) => message.includes(keyword));
    const hasCancionKeyword = message.includes("canción") || message.includes("cancion");
    return hasSeleccionKeyword && hasCancionKeyword;
  }

  private static async handleSeleccionarCancionQuery(query: string): Promise<BotResponse> {
    try {
      console.log("ARCANA procesando selección de canción:", query);

      // Extraer el nombre de la canción del query
      const patterns = [
        /seleccionar\s+([a-záéíóúñ\s]+)\s+para/i,
        /elegir\s+([a-záéíóúñ\s]+)\s+para/i,
        /añadir\s+([a-záéíóúñ\s]+)\s+para/i,
        /agregar\s+([a-záéíóúñ\s]+)\s+para/i,
        /(?:seleccionar|elegir|añadir|agregar)\s+(.+)/i,
      ];

      let nombreCancion = null;
      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match && match[1]) {
          nombreCancion = match[1].trim();
          break;
        }
      }

      if (!nombreCancion || nombreCancion.length < 3) {
        return {
          type: "canciones",
          message:
            '🤖 Lo siento, para seleccionar una canción especifica el nombre completo. Ejemplo: "ARCANA seleccionar Como Lluvia para próximo servicio"',
          expression: 'worried',
        };
      }

      // Buscar la canción en el repertorio
      const { data: canciones, error } = await supabase
        .from("songs")
        .select("*")
        .or(`title.ilike.%${nombreCancion}%,artist.ilike.%${nombreCancion}%`)
        .eq("is_active", true)
        .limit(3);

      if (error) {
        console.error("Error buscando canción:", error);
        return {
          type: "canciones",
          message: "🤖 Lo siento, hubo un error buscando la canción. Intenta nuevamente.",
          expression: 'worried',
        };
      }

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 Lo siento, no encontré la canción "${nombreCancion}" en nuestro repertorio.\n\n💡 Puedes:\n• 🔍 Buscar en el Repertorio\n• ➕ Agregar Nueva Canción`,
          expression: 'worried',
        };
      }

      // Obtener próximo servicio
      const { data: nextService } = await supabase
        .from("services")
        .select("service_date")
        .gte("service_date", new Date().toISOString().split("T")[0])
        .order("service_date", { ascending: true })
        .limit(1)
        .single();

      const serviceDate = nextService?.service_date;

      // Si hay múltiples canciones, mostrar opciones con botones
      if (canciones.length > 1) {
        let mensaje = `🎵 Encontré ${canciones.length} canciones similares a "${nombreCancion}":\n\n`;
        canciones.forEach((cancion, index) => {
          mensaje += `${index + 1}. **${cancion.title}**`;
          if (cancion.artist) mensaje += ` - ${cancion.artist}`;
          mensaje += `\n`;
        });
        
        mensaje += `\n💡 Haz clic en el botón para agregarla al próximo servicio${serviceDate ? ` (${new Date(serviceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})` : ''}.`;

        const actions: BotAction[] = canciones.map((c: any) => ({
          type: 'select_song',
          songId: c.id,
          songName: c.title,
          serviceDate
        }));

        return {
          type: "canciones",
          message: mensaje,
          expression: 'happy',
          actions
        };
      }

      // Una sola canción encontrada
      const cancion = canciones[0];
      let mensaje = `🎵 **Canción encontrada:** ${cancion.title}\n`;
      if (cancion.artist) mensaje += `🎤 **Artista:** ${cancion.artist}\n`;
      if (cancion.genre) mensaje += `🎼 **Género:** ${cancion.genre}\n`;
      if (cancion.key_signature) mensaje += `🎹 **Tono:** ${cancion.key_signature}\n\n`;

      mensaje += `💡 Haz clic en el botón para agregarla al próximo servicio${serviceDate ? ` (${new Date(serviceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})` : ''}.`;

      // Agregar enlaces a YouTube/Spotify si están disponibles
      if (cancion.youtube_link || cancion.spotify_link) {
        mensaje += "\n\n🔗 **Enlaces:**\n";
        if (cancion.youtube_link) mensaje += `• 🎥 Ver en YouTube\n`;
        if (cancion.spotify_link) mensaje += `• 🎧 Escuchar en Spotify\n`;
      }

      const actions: BotAction[] = [{
        type: 'select_song',
        songId: cancion.id,
        songName: cancion.title,
        serviceDate
      }];

      return {
        type: "canciones",
        message: mensaje,
        expression: 'happy',
        actions
      };
    } catch (error) {
      console.error("Error en selección de canción:", error);
      return {
        type: "canciones",
        message: "🤖 Lo siento, hubo un error procesando tu solicitud. Para seleccionar canciones visita la Agenda Ministerial.",
        expression: 'worried',
      };
    }
  }

  private static async handleTurnosQuery(userId: string, currentUser?: any): Promise<BotResponse> {
    console.log("🔍 ARCANA consultando turnos para usuario:", userId);
    console.log("👤 Datos del usuario actual:", currentUser);

    try {
      let memberData = null;
      let profileName = "Usuario";

      // Si tenemos datos del member en currentUser, usarlos
      if (currentUser?.member) {
        memberData = currentUser.member;
        profileName = `${memberData.nombres} ${memberData.apellidos}`;
        console.log("✅ Usando datos de member:", memberData);
      } else {
        // Si no, buscar por userId
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("❌ Error obteniendo perfil:", profileError);
          return {
            type: "turnos",
            message:
              "🤖 Lo siento, no pude identificar tu perfil. Por favor verifica que tu cuenta esté configurada correctamente.",
            expression: 'worried',
          };
        }

        profileName = profile.full_name;
        console.log("📋 Perfil obtenido:", profile);

        // Buscar en members por email o nombre
        if (profile.email) {
          const { data: memberByEmail } = await supabase
            .from("members")
            .select("*")
            .eq("email", profile.email)
            .eq("is_active", true)
            .single();
          
          if (memberByEmail) {
            memberData = memberByEmail;
            console.log("✅ Member encontrado por email:", memberData);
          }
        }

        // Si no se encontró por email, buscar por nombre
        if (!memberData && profile.full_name) {
          const firstName = profile.full_name.split(' ')[0];
          const { data: membersByName } = await supabase
            .from("members")
            .select("*")
            .ilike("nombres", `%${firstName}%`)
            .eq("is_active", true)
            .limit(1);
          
          if (membersByName && membersByName.length > 0) {
            memberData = membersByName[0];
            console.log("✅ Member encontrado por nombre:", memberData);
          }
        }
      }

      // Si tenemos datos del member, buscar en servicios
      if (memberData) {
        const fullName = `${memberData.nombres} ${memberData.apellidos}`;
        console.log("🔍 Buscando servicios para:", fullName);
        return await this.searchUserInServices(fullName, memberData);
      }

      // Si no se encontró member, buscar por grupos (método antiguo como fallback)
      console.log("🔄 Usando método de búsqueda por grupos como fallback");
      const { data: userGroups, error: groupsError } = await supabase
        .from("group_members")
        .select(
          `
          group_id,
          instrument,
          is_leader,
          worship_groups (
            id,
            name
          )
        `,
        )
        .eq("user_id", userId)
        .eq("is_active", true);

      if (groupsError) {
        console.error("❌ Error obteniendo grupos:", groupsError);
        return {
          type: "turnos",
          message:
            "🤖 Lo siento, hubo un error consultando tus grupos. Por favor verifica tu configuración en el sistema.",
          expression: 'worried',
        };
      }

      console.log("👥 Grupos del usuario:", userGroups);

      if (!userGroups || userGroups.length === 0) {
        return {
          type: "turnos",
          message:
            "🎵 Actualmente no estás asignado a ningún grupo de alabanza.\n\n💡 Contacta a tu líder ministerial para que te asigne a un grupo.",
          expression: 'worried',
        };
      }

      // Obtener servicios asignados a los grupos del usuario
      const groupIds = userGroups.map((g) => g.group_id);

      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select(
          `
          *,
          worship_groups (
            name
          )
        `,
        )
        .in("assigned_group_id", groupIds)
        .gte("service_date", new Date().toISOString().split("T")[0])
        .order("service_date", { ascending: true })
        .limit(5);

      if (servicesError) {
        console.error("❌ Error obteniendo servicios:", servicesError);
        return {
          type: "turnos",
          message:
            "🤖 Lo siento, hubo un error consultando los servicios. Por favor intenta nuevamente o consulta la agenda ministerial directamente.",
          expression: 'worried',
        };
      }

      console.log("📅 Servicios encontrados:", services);

      if (!services || services.length === 0) {
        return {
          type: "turnos",
          message:
            "🎵 Actualmente no tienes turnos programados.\n\n💡 Consulta la agenda ministerial para más información o contacta a tu líder.",
          expression: 'worried',
        };
      }

      // Construir mensaje con los próximos turnos
      let mensaje = `👋 **Hola ${profileName}!**\n\n`;
      mensaje += `🎤 Encontré ${services.length} turno${services.length > 1 ? "s" : ""} programado${services.length > 1 ? "s" : ""} para ti:\n\n`;

      services.forEach((service, index) => {
        const serviceDate = new Date(service.service_date);
        const formattedDate = serviceDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Indicar si es el próximo turno
        const isNext = index === 0;
        const prefix = isNext ? "🎯 **PRÓXIMO TURNO:**" : `📅 Turno ${index + 1}:`;

        mensaje += `${prefix}\n`;
        mensaje += `📍 **${service.title || "Servicio de Adoración"}**\n`;
        mensaje += `📆 ${formattedDate}\n`;

        if (service.worship_groups?.name) {
          mensaje += `🎵 Grupo: ${service.worship_groups.name}\n`;
        }

        if (service.leader) {
          mensaje += `👤 Director: ${service.leader}\n`;
        }

        if (service.location) {
          mensaje += `📍 Lugar: ${service.location}\n`;
        }

        // Obtener instrumento del usuario para este grupo
        const userGroupInfo = userGroups.find((g) => g.group_id === service.assigned_group_id);
        if (userGroupInfo) {
          mensaje += `🎸 Tu instrumento: ${userGroupInfo.instrument}\n`;
          if (userGroupInfo.is_leader) {
            mensaje += `⭐ Eres director de este grupo\n`;
          }
        }

        mensaje += "\n";
      });

      mensaje += "💡 **Recuerda:**\n";
      mensaje += "• 🎵 Prepara tu instrumento con anticipación\n";
      mensaje += "• 📖 Revisa el repertorio asignado\n";
      mensaje += "• ⏰ Llega con tiempo para el ensayo previo\n";

      return {
        type: "turnos",
        message: mensaje,
        expression: 'happy',
      };
    } catch (error) {
      console.error("💥 Error consultando turnos:", error);
      return {
        type: "turnos",
        message:
          "🤖 Lo siento, hubo un error consultando los turnos. Por favor intenta nuevamente o consulta la agenda ministerial directamente.\n\n🔗 **[Ver Agenda Ministerial](/agenda)**",
        expression: 'worried',
      };
    }
  }

  private static async searchUserInServices(fullName: string, memberData?: any): Promise<BotResponse> {
    try {
      console.log("🔍 Buscando servicios para:", fullName);
      console.log("📋 Datos del member:", memberData);

      // Normalizar el nombre para búsqueda
      const normalizedName = fullName.toLowerCase().trim();
      const nameParts = normalizedName.split(/\s+/).filter((part) => part.length > 2);

      // Buscar eventos futuros (desde hoy en adelante)
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const { data: eventos, error: eventosError } = await supabase
        .from("services")
        .select("*")
        .gte("service_date", todayStr)
        .order("service_date", { ascending: true })
        .limit(50);

      if (eventosError) {
        console.error("❌ Error consultando eventos:", eventosError);
        return {
          type: "turnos",
          message: "🤖 Lo siento, hubo un error consultando la agenda ministerial. Intenta nuevamente.",
          expression: 'worried',
        };
      }

      console.log("📅 Total de eventos futuros encontrados:", eventos?.length || 0);

      if (!eventos || eventos.length === 0) {
        return {
          type: "turnos",
          message: "🤖 No hay servicios programados en la agenda ministerial para fechas futuras.",
          expression: 'happy',
        };
      }

      // Búsqueda más inteligente en los eventos
      const eventosConUsuario = eventos.filter((evento) => {
        const searchText = [
          evento.leader || "",
          evento.description || "",
          evento.notes || "",
          evento.title || "",
          evento.special_activity || "",
          evento.choir_breaks || "",
          evento.assigned_members || "",
        ]
          .join(" ")
          .toLowerCase();

        // Buscar coincidencias parciales de cada parte del nombre
        const hasNameMatch = nameParts.some((part) => {
          if (part.length < 3) return false;
          // Buscar coincidencia exacta de palabra
          const regex = new RegExp(`\\b${part}\\b`, "i");
          return regex.test(searchText);
        });

        // También buscar el nombre completo
        const hasFullNameMatch = searchText.includes(normalizedName);

        return hasNameMatch || hasFullNameMatch;
      });

      console.log("✅ Eventos con usuario encontrados:", eventosConUsuario.length);

      // Si no se encontraron eventos específicos, mostrar el próximo servicio disponible
      if (eventosConUsuario.length === 0) {
        const proximoEvento = eventos[0]; // El primer evento futuro
        const fecha = new Date(proximoEvento.service_date).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        let mensaje = `👋 **¡Hola ${fullName}!**\n\n`;
        
        if (memberData?.cargo) {
          mensaje += `🎤 **Cargo:** ${memberData.cargo}\n`;
        }
        if (memberData?.voz_instrumento) {
          mensaje += `🎵 **Voz/Instrumento:** ${memberData.voz_instrumento}\n\n`;
        }

        mensaje += `📅 **Próximo servicio en la agenda:**\n\n`;
        mensaje += `**${proximoEvento.title}**\n`;
        mensaje += `🗓️ ${fecha}\n`;
        
        if (proximoEvento.location) {
          mensaje += `📍 ${proximoEvento.location}\n`;
        }
        
        if (proximoEvento.service_time) {
          mensaje += `⏰ Hora: ${proximoEvento.service_time}\n`;
        }

        mensaje += `\n💡 **Nota:** No tienes un turno específico asignado para este servicio.\n`;
        mensaje += `Consulta con tu líder ministerial para confirmar tu participación.`;

        return {
          type: "turnos",
          message: mensaje,
          expression: 'thinking',
        };
      }

      // Mostrar el próximo evento encontrado
      const proximoEvento = eventosConUsuario[0];
      const fecha = new Date(proximoEvento.service_date).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let mensaje = `🎵 **¡Hola ${fullName}!**\n\n`;

      if (memberData?.cargo) {
        mensaje += `🎤 **Cargo:** ${memberData.cargo}\n`;
      }
      if (memberData?.voz_instrumento) {
        mensaje += `🎵 **Voz/Instrumento:** ${memberData.voz_instrumento}\n\n`;
      }

      mensaje += `**🎯 TU PRÓXIMO TURNO:**\n\n`;
      mensaje += `📅 **${proximoEvento.title}**\n`;
      mensaje += `🗓️ ${fecha}\n`;
      
      if (proximoEvento.location) {
        mensaje += `📍 ${proximoEvento.location}\n`;
      }
      
      if (proximoEvento.service_time) {
        mensaje += `⏰ Hora: ${proximoEvento.service_time}\n`;
      }

      if (proximoEvento.leader) {
        mensaje += `👤 **Director:** ${proximoEvento.leader}\n`;
      }

      if (proximoEvento.special_activity) {
        mensaje += `🎯 **Actividad especial:** ${proximoEvento.special_activity}\n`;
      }

      if (proximoEvento.notes) {
        mensaje += `📝 **Notas:** ${proximoEvento.notes}\n`;
      }

      mensaje += "\n¡Prepárate para alabar al Señor! 🙏";

      // Si hay más turnos futuros
      if (eventosConUsuario.length > 1) {
        const otrosEventos = eventosConUsuario
          .slice(1)
          .map((evento) => `• ${new Date(evento.service_date).toLocaleDateString("es-ES")} - ${evento.title}`)
          .join("\n");

        mensaje += `\n\n📋 **También tienes turnos en:**\n${otrosEventos}`;
      }

      return {
        type: "turnos",
        message: mensaje,
        expression: 'happy',
      };
    } catch (error) {
      console.error("💥 Error buscando en servicios:", error);
      return {
        type: "turnos",
        message:
          "🤖 Lo siento, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.",
        expression: 'worried',
      };
    }
  }

  // ... (el resto de los métodos se mantienen igual - handleEnsayosQuery, handleCancionesQuery, etc.)

  static async sendBotResponse(roomId: string, response: BotResponse): Promise<void> {
    try {
      console.log("🤖 ARCANA enviando respuesta:", response.message.substring(0, 50) + "...");

      // Preparar el mensaje con las acciones si existen
      const messageData: any = {
        room_id: roomId,
        user_id: null, // Bot messages will have null user_id
        message: response.message,
        is_bot: true,
        message_type: "text",
        is_deleted: false,
        actions: response.actions && response.actions.length > 0 ? response.actions : null,
      };

      // Usar user_id null para el bot
      const { error } = await supabase.from("chat_messages").insert([messageData]);

      if (error) {
        console.error("❌ Error enviando respuesta del bot:", error);
        throw error;
      }

      console.log("✅ ARCANA respuesta enviada exitosamente");
    } catch (error) {
      console.error("💥 Error enviando respuesta del bot:", error);
    }
  }
}