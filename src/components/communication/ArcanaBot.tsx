import { supabase } from "@/integrations/supabase/client";

interface BotResponse {
  type: "turnos" | "ensayos" | "canciones" | "general";
  message: string;
}

export class ArcanaBot {
  static async processMessage(message: string, roomId: string, userId: string): Promise<BotResponse | null> {
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
      // Verificar si está preguntando por otro usuario
      const otherUser = this.extractUserFromQuery(cleanMessage);
      if (otherUser) {
        return await this.handleTurnosQueryForUser(otherUser);
      } else {
        return await this.handleTurnosQuery(userId);
      }
    } else if (this.isEnsayosQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de ensayos");
      return await this.handleEnsayosQuery();
    } else if (this.isCancionesQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de canciones");
      return await this.handleCancionesQuery(cleanMessage);
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
          "me",
          "mi",
          "cuando",
          "que",
          "el",
          "la",
          "un",
          "una",
          "este",
          "esta",
          "ese",
          "esa",
          "aquel",
          "aquella",
          "cantar",
          "toca",
          "turno",
          "próximo",
          "siguiente",
          "ensayo",
          "canción",
          "cancion",
          "arcana",
          "por",
          "para",
          "de",
          "del",
          "al",
          "y",
          "o",
          "u",
          "con",
          "sin",
          "los",
          "las",
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

      let query = supabase.from("members").select("nombres, apellidos, email").eq("is_active", true);

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
          message: `🤖 No encontré al integrante "${userName}" en nuestro sistema.\n\n💡 **Sugerencias:**\n• Verifica la ortografía del nombre\n• Usa nombre y apellido si es posible\n• Consulta la lista de **[Integrantes Activos](/integrantes)**`,
        };
      }

      // Si hay múltiples coincidencias
      if (members.length > 1) {
        const opciones = members.map((m, i) => `${i + 1}. **${m.nombres} ${m.apellidos}**`).join("\n");

        return {
          type: "turnos",
          message: `🤖 Encontré varios integrantes:\n\n${opciones}\n\n💡 Por favor especifica mejor el nombre. Ejemplo: "ARCANA cuándo le toca a **${members[0].nombres} ${members[0].apellidos.split(" ")[0]}**"`,
        };
      }

      // Un solo resultado
      const member = members[0];
      const fullName = `${member.nombres} ${member.apellidos}`;
      return await this.searchUserInServices(fullName);
    } catch (error) {
      console.error("Error consultando turnos para otro usuario:", error);
      return {
        type: "turnos",
        message:
          "🤖 Disculpa, hubo un error consultando los turnos. Por favor intenta nuevamente o consulta la agenda ministerial directamente.\n\n🔗 **[Ver Agenda Ministerial](/agenda)**",
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
            '🤖 Para seleccionar una canción especifica el nombre completo. Ejemplo: "ARCANA seleccionar Como Lluvia para próximo servicio"',
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
          message: "🤖 Hubo un error buscando la canción. Intenta nuevamente.",
        };
      }

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 No encontré la canción "${nombreCancion}" en nuestro repertorio.\n\n💡 Puedes:\n• 🔍 [Buscar en el Repertorio](/repertorio-musical?search=${encodeURIComponent(nombreCancion)})\n• ➕ [Agregar Nueva Canción](/repertorio-musical?tab=add)`,
        };
      }

      // Si hay múltiples canciones, mostrar opciones
      if (canciones.length > 1) {
        let mensaje = `🎵 Encontré ${canciones.length} canciones similares a "${nombreCancion}":\n\n`;
        canciones.forEach((cancion, index) => {
          mensaje += `${index + 1}. **${cancion.title}**`;
          if (cancion.artist) mensaje += ` - ${cancion.artist}`;
          mensaje += `\n📖 [Ver en Repertorio](/repertorio-musical?search=${encodeURIComponent(cancion.title)})\n\n`;
        });
        mensaje += "🤖 Para seleccionar una canción específica para un servicio:\n";
        mensaje += "1. 📅 Ve a la **[Agenda Ministerial](/agenda)**\n";
        mensaje += "2. 🎵 Selecciona el servicio deseado\n";
        mensaje += "3. ➕ Agrega la canción desde ahí\n\n";
        mensaje += '💬 O especifica mejor el nombre: "ARCANA seleccionar [título exacto] para próximo servicio"';

        return {
          type: "canciones",
          message: mensaje,
        };
      }

      // Una sola canción encontrada
      const cancion = canciones[0];
      let mensaje = `🎵 **Canción encontrada:** ${cancion.title}\n`;
      if (cancion.artist) mensaje += `🎤 **Artista:** ${cancion.artist}\n`;
      if (cancion.genre) mensaje += `🎼 **Género:** ${cancion.genre}\n`;
      if (cancion.key_signature) mensaje += `🎹 **Tono:** ${cancion.key_signature}\n\n`;

      mensaje += "🤖 **Para seleccionar esta canción para un servicio:**\n";
      mensaje += "1. 📅 Ve a la **[Agenda Ministerial](/agenda)**\n";
      mensaje += "2. 🎵 Busca el servicio donde quieres incluirla\n";
      mensaje += "3. ➕ Agrega la canción desde el formulario del servicio\n\n";
      mensaje += `📖 [Ver en Repertorio](/repertorio-musical?search=${encodeURIComponent(cancion.title)})\n`;

      // Agregar enlaces a YouTube/Spotify si están disponibles
      if (cancion.youtube_link || cancion.spotify_link) {
        mensaje += "\n🔗 **Enlaces:**\n";
        if (cancion.youtube_link) mensaje += `• [🎥 Ver en YouTube](${cancion.youtube_link})\n`;
        if (cancion.spotify_link) mensaje += `• [🎧 Escuchar en Spotify](${cancion.spotify_link})\n`;
      }

      return {
        type: "canciones",
        message: mensaje,
      };
    } catch (error) {
      console.error("Error en selección de canción:", error);
      return {
        type: "canciones",
        message:
          "🤖 Hubo un error procesando tu solicitud. Para seleccionar canciones visita la **[Agenda Ministerial](/agenda)**.",
      };
    }
  }

  private static async handleTurnosQuery(userId: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando turnos para usuario:", userId);

      // Buscar información del usuario en perfiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        console.log("No se encontró perfil, buscando en tabla members");

        // Buscar en la tabla members usando el email del usuario autenticado
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return {
            type: "turnos",
            message: "🤖 No pude identificar tu usuario. Asegúrate de estar autenticado correctamente.",
          };
        }

        // Buscar en members por email
        const { data: member, error: memberError } = await supabase
          .from("members")
          .select("nombres, apellidos")
          .eq("email", user.email)
          .single();

        if (memberError || !member) {
          return {
            type: "turnos",
            message:
              "🤖 No encontré tu información en el sistema de integrantes. Contacta a tu líder para actualizar tus datos.",
          };
        }

        // Usar el nombre completo del member
        const fullName = `${member.nombres} ${member.apellidos}`;
        return await this.searchUserInServices(fullName);
      }

      // Usar el nombre del perfil
      return await this.searchUserInServices(profile.full_name);
    } catch (error) {
      console.error("Error consultando turnos:", error);
      return {
        type: "turnos",
        message:
          "🤖 Disculpa, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.",
      };
    }
  }

  private static async searchUserInServices(fullName: string): Promise<BotResponse> {
    try {
      console.log("Buscando servicios para:", fullName);

      // Normalizar el nombre para búsqueda
      const normalizedName = fullName.toLowerCase().trim();
      const nameParts = normalizedName.split(/\s+/).filter((part) => part.length > 2);

      // Buscar eventos futuros y recientes (60 días)
      const today = new Date();
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(today.getDate() - 60);

      const { data: eventos, error: eventosError } = await supabase
        .from("services")
        .select("*")
        .gte("service_date", sixtyDaysAgo.toISOString().split("T")[0])
        .order("service_date", { ascending: true })
        .limit(100);

      if (eventosError) {
        console.error("Error consultando eventos:", eventosError);
        return {
          type: "turnos",
          message: "🤖 Hubo un error consultando la agenda ministerial. Intenta nuevamente.",
        };
      }

      console.log("Total de eventos encontrados:", eventos?.length || 0);

      if (!eventos || eventos.length === 0) {
        return {
          type: "turnos",
          message: "🤖 No hay servicios programados en la agenda ministerial.",
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

      console.log("Eventos con usuario encontrados:", eventosConUsuario.length);

      // Separar eventos pasados y futuros
      const today_str = today.toISOString().split("T")[0];
      const eventosPasados = eventosConUsuario.filter((evento) => evento.service_date < today_str);
      const eventosFuturos = eventosConUsuario.filter((evento) => evento.service_date >= today_str);

      // Si hay eventos futuros, mostrar el próximo
      if (eventosFuturos.length > 0) {
        const proximoEvento = eventosFuturos[0];
        const fecha = new Date(proximoEvento.service_date).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        let mensaje = `🎵 **¡Hola ${fullName}!**\n\nTu próximo turno es:\n\n📅 **${proximoEvento.title}**\n🗓️ ${fecha}\n📍 ${proximoEvento.location || "Ubicación por confirmar"}`;

        // Agregar información adicional
        if (proximoEvento.service_time) {
          mensaje += `\n⏰ Hora: ${proximoEvento.service_time}`;
        }

        if (proximoEvento.special_activity) {
          mensaje += `\n🎯 Actividad: ${proximoEvento.special_activity}`;
        }

        if (proximoEvento.notes) {
          mensaje += `\n📝 Notas: ${proximoEvento.notes}`;
        }

        mensaje += "\n\n¡Prepárate para alabar al Señor! 🙏";

        // Si hay más turnos futuros
        if (eventosFuturos.length > 1) {
          const otrosEventos = eventosFuturos
            .slice(1)
            .map((evento) => `• ${new Date(evento.service_date).toLocaleDateString("es-ES")} - ${evento.title}`)
            .join("\n");

          mensaje += `\n\n📋 **También tienes:**\n${otrosEventos}`;
        }

        return {
          type: "turnos",
          message: mensaje,
        };
      }

      // Si no hay futuros pero sí pasados
      if (eventosPasados.length > 0) {
        const ultimoEvento = eventosPasados[eventosPasados.length - 1];
        const fecha = new Date(ultimoEvento.service_date).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return {
          type: "turnos",
          message: `🎵 **Hola ${fullName}!**\n\nTu último turno registrado fue:\n\n📅 **${ultimoEvento.title}**\n🗓️ ${fecha}\n📍 ${ultimoEvento.location || "Ubicación por confirmar"}\n\n💡 No tienes turnos futuros programados. Consulta con tu líder de grupo para próximos servicios.`,
        };
      }

      // Si no se encontró ningún evento
      return {
        type: "turnos",
        message: `🤖 **Hola ${fullName}!**\n\nNo encontré turnos programados para ti en los próximos servicios.\n\n💡 **Sugerencias:**\n• Verifica que tu nombre esté correctamente escrito en el sistema\n• Consulta con tu líder de grupo sobre próximas asignaciones\n• Revisa la **[Agenda Ministerial completa](/agenda)**`,
      };
    } catch (error) {
      console.error("Error buscando en servicios:", error);
      return {
        type: "turnos",
        message:
          "🤖 Disculpa, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.\n\n🔗 **[Ver Agenda Ministerial](/agenda)**",
      };
    }
  }

  private static async handleEnsayosQuery(): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando ensayos - respuesta fija para viernes");

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
      const fechaEnsayo = nextFriday.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const mensaje = `🎵 **Próximo Ensayo:**\n\n📅 ${fechaEnsayo}\n⏰ 07:00 p.m. a 09:00 p.m.\n📍 Ubicación habitual de ensayo\n\n¡No faltes! La alabanza requiere preparación. 🙏`;

      return {
        type: "ensayos",
        message: mensaje,
      };
    } catch (error) {
      console.error("Error generando respuesta de ensayos:", error);
      return {
        type: "ensayos",
        message:
          "🤖 Disculpa, hubo un error consultando los ensayos. Los ensayos son todos los viernes de 07:00 p.m. a 09:00 p.m.",
      };
    }
  }

  private static async handleCancionesQuery(query: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando canciones con query:", query);

      // Extraer términos de búsqueda
      const searchTerms = query.replace(/canción|cancion|canciones|buscar|repertorio|música|song/gi, "").trim();

      if (!searchTerms) {
        return {
          type: "canciones",
          message:
            '🤖 Para buscar canciones, especifica el nombre o categoría. Ejemplo: "ARCANA buscar alabanza" o "ARCANA canción espíritu santo"',
        };
      }

      const { data: canciones, error } = await supabase
        .from("songs")
        .select("*")
        .or(
          `title.ilike.%${searchTerms}%,artist.ilike.%${searchTerms}%,genre.ilike.%${searchTerms}%,tags.cs.{${searchTerms}}`,
        )
        .eq("is_active", true)
        .limit(5);

      if (error) {
        console.error("Error buscando canciones:", error);
        return {
          type: "canciones",
          message: "🤖 Disculpa, hubo un error buscando canciones. Consulta directamente el repertorio musical.",
        };
      }

      console.log("Canciones encontradas:", canciones?.length || 0);

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 No encontré canciones con "${searchTerms}". Puedes buscar por título, artista, género o etiquetas en nuestro repertorio.\n\n🔗 **[Ver Repertorio Completo](/repertorio-musical)**`,
        };
      }

      let mensaje = `🎵 **Encontré ${canciones.length} canción(es) con "${searchTerms}":**\n\n`;

      canciones.forEach((cancion, index) => {
        mensaje += `${index + 1}. **${cancion.title}**\n`;
        if (cancion.artist) mensaje += `🎤 ${cancion.artist}\n`;
        if (cancion.genre) mensaje += `🎼 ${cancion.genre}\n`;
        if (cancion.key_signature) mensaje += `🎹 Tono: ${cancion.key_signature}\n`;
        if (cancion.difficulty_level) {
          const difficulty = ["", "Muy Fácil", "Fácil", "Intermedio", "Difícil", "Muy Difícil"][
            cancion.difficulty_level
          ];
          mensaje += `⭐ Dificultad: ${difficulty}\n`;
        }

        // Agregar enlaces útiles
        const links = [];
        if (cancion.youtube_link) links.push(`[🎥 YouTube](${cancion.youtube_link})`);
        if (cancion.spotify_link) links.push(`[🎧 Spotify](${cancion.spotify_link})`);
        links.push(`[📖 Ver en Repertorio](/repertorio-musical?search=${encodeURIComponent(cancion.title)})`);

        if (links.length > 0) {
          mensaje += `🔗 ${links.join(" • ")}\n`;
        }

        mensaje += "\n";
      });

      // Agregar opciones adicionales
      mensaje += "💡 **Opciones disponibles:**\n";
      mensaje += "• 📖 [Ver Repertorio Completo](/repertorio-musical)\n";
      mensaje += "• ➕ [Agregar Nueva Canción](/repertorio-musical?tab=add)\n";
      mensaje += "• 🗓️ Para seleccionar una canción para un servicio, visita la **Agenda Ministerial**\n";
      mensaje += '\n💬 También puedes preguntar: "ARCANA seleccionar [nombre canción] para próximo servicio"';

      return {
        type: "canciones",
        message: mensaje,
      };
    } catch (error) {
      console.error("Error buscando canciones:", error);
      return {
        type: "canciones",
        message:
          "🤖 Disculpa, hubo un error buscando canciones. Consulta directamente el repertorio musical.\n\n🔗 **[Ver Repertorio Musical](/repertorio-musical)**",
      };
    }
  }

  private static async handleGeneralQuery(query: string): Promise<BotResponse> {
    console.log("ARCANA manejando consulta general:", query);

    // Detectar consultas de cumpleaños
    if (query.includes("cumpleaños") || query.includes("cumpleanos")) {
      return await this.handleBirthdayQuery(query);
    }

    // Detectar consultas bíblicas
    if (
      query.includes("versículo") ||
      query.includes("versiculo") ||
      query.includes("biblia") ||
      query.includes("cita bíblica")
    ) {
      return this.handleBibleQuery(query);
    }

    // Respuestas predefinidas para consultas generales relacionadas con el ministerio
    const responses = {
      valores:
        "🤖 Nuestros valores fundamentales son: **Fe, Adoración, Comunidad, Servicio y Excelencia**. Cada integrante del ministerio debe reflejar estos valores en su vida y servicio.",
      horarios:
        "🤖 Los horarios regulares son: Ensayos los miércoles 7:00 PM, Servicio domingo 9:00 AM. Para horarios específicos, consulta la agenda ministerial.",
      contacto:
        "🤖 Para contactar a los líderes del ministerio, puedes usar este sistema de comunicación o consultar en la sección de Integrantes.",
      ayuda: `🤖 **¡Hola! Soy ARCANA, tu asistente del ministerio ADN Arca de Noé.** ✨

**¿En qué puedo ayudarte?**

🎵 **TURNOS Y AGENDA**
• "¿Cuándo me toca cantar?"
• "¿Cuándo le toca a [nombre]?"
• "Próximo turno"
• "Mi agenda"

📅 **ENSAYOS**
• "Próximo ensayo"
• "Cuándo es el ensayo"
• "Horario de ensayos"

🎶 **CANCIONES Y REPERTORIO**
• "Buscar [nombre canción]"
• "Seleccionar [canción] para servicio"
• "Repertorio de alabanza"

🎂 **CUMPLEAÑOS**
• "Cumpleaños de hoy"
• "Cumpleaños del mes"
• "Cumpleaños de enero"

📖 **BIBLIA Y ESPIRITUAL**
• "Versículo del día"
• "Cita bíblica sobre [tema]"

💡 **EJEMPLOS PRÁCTICOS:**
• "ARCANA cuándo me toca cantar"
• "ARCANA buscar Como Lluvia"
• "ARCANA cuándo le toca a Armando Noel"
• "ARCANA próximo ensayo"
• "ARCANA cumpleaños de hoy"
• "ARCANA versículo del día"

¡Estoy aquí para servirte! 🙏🎵`,
    };

    // Buscar coincidencias en las consultas
    for (const [key, response] of Object.entries(responses)) {
      if (query.includes(key)) {
        console.log("ARCANA encontró respuesta para:", key);
        return { type: "general", message: response };
      }
    }

    // Respuesta por defecto
    console.log("ARCANA usando respuesta por defecto");
    return {
      type: "general",
      message:
        '🤖 No entendí tu consulta. Escribe "ARCANA ayuda" para ver todas las opciones disponibles.\n\n💡 Puedo ayudarte con:\n• Turnos de canto\n• Información de ensayos\n• Búsqueda de canciones\n• Selección de repertorio\n• Cumpleaños del ministerio\n• Versículos bíblicos',
    };
  }

  private static async handleBirthdayQuery(query: string): Promise<BotResponse> {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    try {
      // Buscar cumpleaños de hoy
      if (query.includes("hoy") || query.includes("día")) {
        const { data: birthdays, error } = await supabase
          .from("members")
          .select("nombres, apellidos, fecha_nacimiento")
          .eq("is_active", true)
          .not("fecha_nacimiento", "is", null);

        if (error) throw error;

        const todayBirthdays =
          birthdays?.filter((member) => {
            if (!member.fecha_nacimiento) return false;
            const birthDate = new Date(member.fecha_nacimiento);
            return birthDate.getMonth() + 1 === currentMonth && birthDate.getDate() === currentDay;
          }) || [];

        if (todayBirthdays.length === 0) {
          return {
            type: "general",
            message: `🎂 **Cumpleaños de hoy (${currentDay}/${currentMonth}):**\n\n😊 No hay cumpleaños registrados para hoy.\n\n📅 **[Ver Módulo de Cumpleaños](/cumpleanos)** para consultar los próximos cumpleaños del ministerio.\n\n¡Celebremos juntos! 🙏✨`,
          };
        }

        let mensaje = `🎂 **¡Cumpleaños de hoy!** 🎉\n\n`;
        todayBirthdays.forEach((member) => {
          mensaje += `🎈 **${member.nombres} ${member.apellidos}**\n`;
        });
        mensaje += `\n💝 ¡No olvides felicitar a ${todayBirthdays.length > 1 ? "nuestros hermanos" : "nuestro hermano"}!\n\n📅 **[Ver más en Módulo de Cumpleaños](/cumpleanos)**`;

        return { type: "general", message: mensaje };
      }

      // Buscar cumpleaños del mes
      if (
        query.includes("mes") ||
        query.includes("enero") ||
        query.includes("febrero") ||
        query.includes("marzo") ||
        query.includes("abril") ||
        query.includes("mayo") ||
        query.includes("junio") ||
        query.includes("julio") ||
        query.includes("agosto") ||
        query.includes("septiembre") ||
        query.includes("octubre") ||
        query.includes("noviembre") ||
        query.includes("diciembre")
      ) {
        const { data: birthdays, error } = await supabase
          .from("members")
          .select("nombres, apellidos, fecha_nacimiento")
          .eq("is_active", true)
          .not("fecha_nacimiento", "is", null);

        if (error) throw error;

        const monthBirthdays =
          birthdays
            ?.filter((member) => {
              if (!member.fecha_nacimiento) return false;
              const birthDate = new Date(member.fecha_nacimiento);
              return birthDate.getMonth() + 1 === currentMonth;
            })
            .sort((a, b) => {
              const dateA = new Date(a.fecha_nacimiento);
              const dateB = new Date(b.fecha_nacimiento);
              return dateA.getDate() - dateB.getDate();
            }) || [];

        if (monthBirthdays.length === 0) {
          return {
            type: "general",
            message: `🎂 **Cumpleaños del mes:**\n\n😊 No hay cumpleaños registrados para este mes.\n\n📅 **[Ver Módulo de Cumpleaños](/cumpleanos)**\n\n¡Celebremos juntos! 🙏✨`,
          };
        }

        const monthNames = [
          "",
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];
        let mensaje = `🎂 **Cumpleaños de ${monthNames[currentMonth]}:** 🎉\n\n`;

        monthBirthdays.forEach((member) => {
          const birthDate = new Date(member.fecha_nacimiento);
          const day = birthDate.getDate();
          mensaje += `📅 ${day} - **${member.nombres} ${member.apellidos}**\n`;
        });

        mensaje += `\n💝 Total: ${monthBirthdays.length} cumpleañero${monthBirthdays.length > 1 ? "s" : ""}\n\n📅 **[Ver más en Módulo de Cumpleaños](/cumpleanos)**\n\n¡No olvides felicitar a tus hermanos en Cristo! 🙏✨`;

        return { type: "general", message: mensaje };
      }

      return {
        type: "general",
        message: `🎂 **Información de cumpleaños:**\n\n🤖 Para consultar cumpleaños puedes usar:\n\n• "ARCANA cumpleaños de hoy"\n• "ARCANA cumpleaños del mes"\n• "ARCANA cumpleaños de enero" (o cualquier mes)\n\n📅 **[Ir al Módulo de Cumpleaños](/cumpleanos)**\n\n¡Celebremos la vida que Dios nos ha dado! 🙏✨`,
      };
    } catch (error) {
      console.error("Error consultando cumpleaños:", error);
      return {
        type: "general",
        message: `🎂 **Cumpleaños:**\n\n🤖 Hubo un error consultando los cumpleaños. Por favor visita:\n\n📅 **[Módulo de Cumpleaños](/cumpleanos)**\n\n¡Celebremos juntos! 🙏✨`,
      };
    }
  }

  private static handleBibleQuery(query: string): BotResponse {
    if (query.includes("día") || query.includes("hoy")) {
      return {
        type: "general",
        message: `📖 **Versículo del día:**\n\n🤖 Para el versículo diario y reflexiones espirituales, visita:\n\n✨ **[Módulo Espiritual](/modulo-espiritual)**\n\nAllí encontrarás:\n• 📖 Versículo del día con reflexión\n• 📚 Historia de versículos anteriores\n• 🙏 Meditaciones y estudios\n• 💫 Inspiración diaria\n\n"La palabra de Dios es viva y eficaz" - Hebreos 4:12 🙏✨`,
      };
    }

    return {
      type: "general",
      message: `📖 **Consultas bíblicas:**\n\n🤖 Para versículos, reflexiones y estudios bíblicos:\n\n✨ **[Ir al Módulo Espiritual](/modulo-espiritual)**\n\nPuedes consultar:\n• "ARCANA versículo del día"\n• "ARCANA cita bíblica sobre amor"\n• "ARCANA biblia de hoy"\n\n"Lámpara es a mis pies tu palabra, y lumbrera a mi camino" - Salmo 119:105 🙏✨`,
    };
  }

  static async sendBotResponse(roomId: string, response: BotResponse): Promise<void> {
    try {
      console.log("ARCANA enviando respuesta:", response.message.substring(0, 50) + "...");

      // Usar user_id null para el bot
      const { error } = await supabase.from("chat_messages").insert([
        {
          room_id: roomId,
          user_id: null, // Bot messages will have null user_id
          message: response.message,
          is_bot: true,
          message_type: "text",
          is_deleted: false,
        },
      ]);

      if (error) {
        console.error("Error enviando respuesta del bot:", error);
        throw error;
      }

      console.log("ARCANA respuesta enviada exitosamente");
    } catch (error) {
      console.error("Error enviando respuesta del bot:", error);
    }
  }
}
