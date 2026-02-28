import { supabase } from "@/integrations/supabase/client";

export type SongPurpose = "worship" | "offering" | "communion";

export type BotActionType = "select_song" | "menu_option";

export interface BotAction {
  type: BotActionType;
  songId: string;
  songName: string;
  serviceDate?: string;
  serviceId?: string;
  coverImageUrl?: string;
  keySignature?: string;
  songPurpose?: SongPurpose;
  // Menu action fields
  menuCommand?: string;
  menuLabel?: string;
  menuIcon?: string;
}

interface BotResponse {
  type: "turnos" | "ensayos" | "canciones" | "general" | "menu";
  message: string;
  expression?: "thinking" | "happy" | "worried";
  actions?: BotAction[];
}

// Cache para mejorar rendimiento
class ArcanaCache {
  private static instance: ArcanaCache;
  private membersCache: any[] | null = null;
  private membersCacheTime: number = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutos

  static getInstance(): ArcanaCache {
    if (!ArcanaCache.instance) {
      ArcanaCache.instance = new ArcanaCache();
    }
    return ArcanaCache.instance;
  }

  async getMembers(): Promise<any[]> {
    const now = Date.now();
    if (this.membersCache && now - this.membersCacheTime < this.cacheDuration) {
      return this.membersCache;
    }

    const { data: members, error } = await supabase
      .from("members")
      .select("id, nombres, apellidos, cargo, voz_instrumento, fecha_nacimiento")
      .eq("is_active", true);

    if (error) {
      console.error("Error cargando miembros:", error);
      return [];
    }

    this.membersCache = members || [];
    this.membersCacheTime = now;
    return this.membersCache;
  }

  clearCache() {
    this.membersCache = null;
    this.membersCacheTime = 0;
  }

  // NUEVO: Obtener foto de usuario desde members
  async getUserPhoto(userId: string): Promise<string | null> {
    try {
      // Primero buscar en profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, photo_url")
        .eq("id", userId)
        .single();

      if (profile?.photo_url) {
        return profile.photo_url;
      }

      // Si no hay foto en profile, buscar en members por nombre
      if (profile?.full_name) {
        const firstName = profile.full_name.split(" ")[0];
        const { data: member } = await supabase
          .from("members")
          .select("photo_url")
          .ilike("nombres", `%${firstName}%`)
          .single();

        return member?.photo_url || null;
      }

      return null;
    } catch (error) {
      console.error("Error getting user photo:", error);
      return null;
    }
  }
}

// Diccionario de nombres comunes y sus variantes - MEJORADO
const nameDictionary: { [key: string]: string[] } = {
  nicolas: ["nicolas", "nicolás", "felix nicolas", "felix nicolás", "felix", "félix"],
  felix: ["felix", "félix", "felix nicolas", "felix nicolás", "nicolas", "nicolás"],
  keyla: ["keyla", "keyla yanira", "keyla medrano", "yanira"],
  armando: ["armando", "armando noel", "noel"],
  damaris: ["damaris", "damaris castillo", "massy", "massy castillo"],
  massy: ["massy", "damaris", "damaris castillo", "massy castillo"],
  eliabi: ["eliabi", "eliabi joana", "joana"],
  roosevelt: ["roosevelt", "roosevelt martinez", "pastor roosevelt"],
  denny: ["denny", "denny santana", "denny alberto"],
  aleida: ["aleida", "aleida batista", "aleida geomar"],
  ruth: ["ruth", "ruth santana", "ruth esther"],
  david: ["david", "david santana"],
  enger: ["enger", "enger julio", "julio"],
  wilton: ["wilton", "wilton gomez", "gomez"],
  katherine: ["katherine", "katherine orquidea", "orquidea"],
  jhoyve: ["jhoyve", "jhoyve shantal", "shantal"],
};

// NUEVO: Diccionario de nicknames para menciones
const nicknameDictionary: { [key: string]: string } = {
  masy: "Damaris Castillo",
  massey: "Damaris Castillo",
  masi: "Damaris Castillo",
  armand: "Armando Noel",
  armandito: "Armando Noel",
  noe: "Armando Noel",
  charly: "Carlos Rodriguez",
  charli: "Carlos Rodriguez",
  mary: "Maria Garcia",
  mery: "Maria Garcia",
  nico: "Felix Nicolas",
  feli: "Felix Nicolas",
};

export class ArcanaBot {
  private static cache = ArcanaCache.getInstance();

  // NUEVO: Extraer menciones de mensajes
  private static extractMentions(message: string): string[] {
    const mentionRegex = /@([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]{2,})/g;
    const matches = message.matchAll(mentionRegex);
    const mentions: string[] = [];

    for (const match of matches) {
      if (match[1]) {
        mentions.push(match[1].trim());
      }
    }

    return mentions;
  }

  // NUEVO: Buscar usuario por nickname
  private static async findUserByNickname(nickname: string): Promise<string | null> {
    const normalizedNick = nickname.toLowerCase().trim();

    // Buscar en el diccionario de nicknames
    if (nicknameDictionary[normalizedNick]) {
      return nicknameDictionary[normalizedNick];
    }

    // Buscar en la base de datos por nombre o apellido
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("nombres, apellidos")
        .eq("is_active", true)
        .or(`nombres.ilike.%${normalizedNick}%,apellidos.ilike.%${normalizedNick}%`)
        .limit(1);

      if (!error && members && members.length > 0) {
        return `${members[0].nombres} ${members[0].apellidos}`;
      }
    } catch (error) {
      console.error("Error buscando usuario por nickname:", error);
    }

    return null;
  }

  static async processMessage(message: string, roomId: string, userId: string): Promise<BotResponse | null> {
    // Detección más flexible de menciones - AHORA INCLUYE "ARCA"
    const mentionsBot = /arcana|arca|@arcana|@arca|bot|asistente/i.test(message);

    if (!mentionsBot) {
      console.log("ARCANA: Mensaje no contiene mención");
      return null;
    }

    // Limpiar mensaje más efectivamente
    const cleanMessage = message
      .replace(/@arcana\s*:?\s*/gi, "")
      .replace(/@arca\s*:?\s*/gi, "")
      .replace(/arcana\s*:?\s*/gi, "")
      .replace(/arca\s*:?\s*/gi, "")
      .replace(/^(?:bot|asistente)\s*/gi, "")
      .replace(/^\s*[:,-]\s*/, "")
      .trim()
      .toLowerCase();

    console.log("ARCANA procesando mensaje limpio:", cleanMessage);

    // Si está vacío o es saludo
    if (!cleanMessage || /^(hola|hi|hey|buenos|buenas|saludos)/i.test(cleanMessage)) {
      return this.getHelpResponse();
    }

    // Analizar el tipo de consulta con mejor detección
    const queryType = this.analyzeQueryType(cleanMessage);
    console.log("ARCANA tipo de consulta detectada:", queryType);

    switch (queryType) {
      case "menu":
        return this.getMenuResponse();

      case "turnos_propios":
        return await this.handleTurnosQuery(userId);

      case "turnos_otros":
        const userName = this.extractUserName(cleanMessage);
        if (userName) {
          return await this.handleTurnosQueryForUser(userName);
        } else {
          return {
            type: "turnos",
            message: "🤖 ¿Para quién quieres consultar los turnos? Ejemplo: 'ARCANA cuando le toca a Keyla'",
            expression: "thinking",
          };
        }

      case "ensayos":
        return await this.getEnsayosResponse();

      case "canciones_buscar":
        return await this.handleCancionesBuscar(cleanMessage, userId);

      case "canciones_seleccionar":
        return await this.handleCancionesSeleccionar(cleanMessage, userId);

      case "cumpleanos":
        return await this.handleBirthdayQuery(cleanMessage);

      case "resumen_canciones":
        return await this.handleWeekendSongsSummary();

      case "ayuda":
        return this.getHelpResponse();

      default:
        return this.getDefaultResponse();
    }
  }

  private static analyzeQueryType(message: string): string {
    // Patrones mejorados para detección de intenciones
    const patterns = {
      turnos_propios: [
        /(cu[áa]ndo\s+)?me\s+toca/,
        /mi\s+(pr[oó]ximo\s+)?turno/,
        /pr[oó]ximo\s+turno/,
        /me\s+toca\s+cantar/,
        /cu[áa]ndo\s+me\s+toca\s+cantar/,
        /mi\s+agenda/,
      ],
      turnos_otros: [
        /(cu[áa]ndo\s+)?le\s+toca\s+a\s+([a-záéíóúñü\s]{2,})/,
        /turno\s+(?:de|para)\s+([a-záéíóúñü\s]{2,})/,
        /(?:y\s+)?([a-záéíóúñü\s]{2,})\s+(?:cu[áa]ndo\s+le\s+toca|pr[oó]ximo\s+turno)/,
        /cu[áa]ndo\s+canta\s+([a-záéíóúñü\s]{2,})/,
      ],
      ensayos: [/ensayo/, /ensayos/, /pr[áa]ctica/, /practicas/, /rehearsal/],
      canciones_buscar: [/buscar/, /canci[óo]n/, /canciones/, /repertorio/, /m[úu]sica/, /song/, /ofrendas?/, /santa\s*(?:cena|comuni[oó]n)/, /comuni[oó]n/],
      canciones_seleccionar: [/seleccionar/, /elegir/, /a[ñn]adir/, /agregar/, /para\s+servicio/],
      cumpleanos: [/cumplea[ñn]os/, /cumple/, /fiesta/, /natalicio/],
      ayuda: [/ayuda/, /help/, /qu[eé]\s+puedes/, /opciones/, /comandos/],
    };

    for (const [type, typePatterns] of Object.entries(patterns)) {
      for (const pattern of typePatterns) {
        if (pattern.test(message)) {
          return type;
        }
      }
    }

    return "general";
  }

  private static extractUserName(message: string): string | null {
    // Patrones para extraer nombres
    const patterns = [
      /le\s+toca\s+a\s+([a-záéíóúñü\s]{2,})/i,
      /turno\s+(?:de|para)\s+([a-záéíóúñü\s]{2,})/i,
      /cu[áa]ndo\s+canta\s+([a-záéíóúñü\s]{2,})/i,
      /([a-záéíóúñü\s]{2,})\s+cu[áa]ndo\s+le\s+toca/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim().toLowerCase();

        // Filtrar palabras comunes
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
          "cantar",
          "toca",
          "turno",
          "próximo",
          "siguiente",
          "ensayo",
          "canción",
          "arcana",
          "por",
          "para",
          "de",
          "del",
          "al",
          "y",
          "o",
          "con",
          "sin",
          "los",
          "las",
          "su",
        ];

        const words = extractedName.split(/\s+/);
        const validWords = words.filter((word) => word.length >= 2 && !commonWords.includes(word));

        if (validWords.length > 0) {
          console.log("Nombre extraído:", validWords.join(" "));
          return validWords.join(" ");
        }
      }
    }

    return null;
  }

  private static async handleTurnosQueryForUser(userName: string): Promise<BotResponse> {
    try {
      console.log("🔍 Buscando turnos para:", userName);

      // Cargar miembros desde cache
      const members = await this.cache.getMembers();

      // Buscar en el diccionario primero
      const normalizedUserName = userName.toLowerCase().trim();
      let searchTerms = [normalizedUserName];

      // Expandir búsqueda usando el diccionario
      for (const [canonicalName, variants] of Object.entries(nameDictionary)) {
        if (variants.includes(normalizedUserName)) {
          searchTerms = [...variants];
          break;
        }
      }

      console.log("Términos de búsqueda:", searchTerms);

      // Buscar miembros que coincidan - MEJORADO con filtro más estricto
      const matchingMembers = members.filter((member) => {
        const fullName = `${member.nombres} ${member.apellidos}`.toLowerCase();
        const normalizedFullName = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Búsqueda más estricta para evitar falsos positivos
        return searchTerms.some((term) => {
          const normalizedTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // Para nombres comunes como "martinez", buscar coincidencia exacta de palabra
          if (term.length <= 3) {
            const regex = new RegExp(`\\b${normalizedTerm}\\b`, "i");
            return regex.test(normalizedFullName);
          }

          return (
            fullName.includes(normalizedTerm) ||
            normalizedFullName.includes(normalizedTerm) ||
            member.nombres.toLowerCase().includes(normalizedTerm) ||
            member.apellidos.toLowerCase().includes(normalizedTerm)
          );
        });
      });

      console.log("Miembros encontrados:", matchingMembers.length);

      if (matchingMembers.length === 0) {
        return {
          type: "turnos",
          message: `🤖 No encontré al integrante "${userName}" en nuestro sistema.\n\n💡 **Sugerencias:**\n• Verifica la ortografía\n• Usa nombre y apellido\n• Consulta la lista de **[Integrantes Activos](/integrantes)**`,
          expression: "worried",
        };
      }

      // Si hay múltiples coincidencias, filtrar mejor
      let filteredMembers = matchingMembers;
      if (matchingMembers.length > 1) {
        // Filtrar por coincidencia exacta si es posible
        const exactMatches = matchingMembers.filter((member) => {
          const fullName = `${member.nombres} ${member.apellidos}`.toLowerCase();
          return searchTerms.some((term) => fullName.includes(term));
        });

        if (exactMatches.length > 0) {
          filteredMembers = exactMatches;
        }
      }

      // Si todavía hay múltiples coincidencias
      if (filteredMembers.length > 1) {
        const opciones = filteredMembers.map((m, i) => `${i + 1}. **${m.nombres} ${m.apellidos}**`).join("\n");

        return {
          type: "turnos",
          message: `🤖 Encontré varios integrantes:\n\n${opciones}\n\n💡 Especifica mejor el nombre. Ejemplo: "ARCANA cuándo le toca a **${filteredMembers[0].nombres}**"`,
          expression: "thinking",
        };
      }

      // Un solo resultado
      const member = filteredMembers[0];
      const fullName = `${member.nombres} ${member.apellidos}`;
      return await this.searchUserInServices(fullName, member);
    } catch (error) {
      console.error("Error consultando turnos para otro usuario:", error);
      return {
        type: "turnos",
        message: "🤖 Error consultando los turnos. Intenta nuevamente.",
        expression: "worried",
      };
    }
  }

  private static async handleTurnosQuery(userId: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando turnos para usuario:", userId);

      // Obtener datos del usuario
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error obteniendo perfil:", profileError);
        return {
          type: "turnos",
          message: "🤖 No pude identificar tu perfil. Verifica tu cuenta.",
          expression: "worried",
        };
      }

      console.log("Perfil encontrado:", profile.full_name);

      // Buscar en members table para obtener más información
      const members = await this.cache.getMembers();
      const memberInfo = members.find((member) => {
        const memberFullName = `${member.nombres} ${member.apellidos}`.toLowerCase();
        const profileName = profile.full_name.toLowerCase();
        return memberFullName.includes(profileName) || profileName.includes(member.nombres.toLowerCase());
      });

      console.log("Información del miembro encontrada:", memberInfo);

      // Buscar servicios donde el usuario aparece como líder o en notes - MEJORADO
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .or(`leader.ilike.%${profile.full_name}%,notes.ilike.%${profile.full_name}%`)
        .gte("service_date", new Date().toISOString().split("T")[0])
        .order("service_date", { ascending: true })
        .limit(10); // Aumentamos el límite para mejor filtrado

      if (servicesError) {
        console.error("Error obteniendo servicios:", servicesError);
        return {
          type: "turnos",
          message: "🤖 Error consultando los servicios.",
          expression: "worried",
        };
      }

      console.log("Servicios encontrados:", services?.length || 0);

      if (!services || services.length === 0) {
        return {
          type: "turnos",
          message: "🎵 No tienes turnos programados.\n\n💡 Consulta la agenda ministerial para más información.",
          expression: "worried",
        };
      }

      // Construir respuesta
      return this.formatTurnosResponse(profile.full_name, memberInfo, services);
    } catch (error) {
      console.error("Error consultando turnos:", error);
      return {
        type: "turnos",
        message: "🤖 Error consultando los turnos.",
        expression: "worried",
      };
    }
  }

  private static formatTurnosResponse(userName: string, memberInfo: any, services: any[]): BotResponse {
    // Información del miembro
    let mensaje = '';
    
    if (memberInfo) {
      mensaje += `🎵 **¡Hola ${userName}!**\n\n`;
      mensaje += `🎤 **Cargo:** ${memberInfo.cargo || "No especificado"}\n`;
      if (memberInfo.voz_instrumento) {
        mensaje += `🎵 **Voz/Instrumento:** ${memberInfo.voz_instrumento}\n`;
      }
      mensaje += `\n`;
    }

    // Filtrar servicios duplicados y limitar a 5
    const uniqueServices = this.filterUniqueServices(services).slice(0, 5);

    const proximoService = uniqueServices[0];

    // CORREGIDO: Formato de hora mejorado
    const serviceTime = this.formatServiceTime(proximoService.service_date, proximoService.title);
    const formattedDate = new Date(proximoService.service_date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Formato mejorado con nombre destacado  
    mensaje += `Tu próximo turno es:\n\n`;
    mensaje += `⏰ **Hora:** ${serviceTime}\n`;
    mensaje += `📅 **Día:** ${formattedDate}\n`;
    mensaje += `📍 **Lugar:** ${proximoService.location || "Templo Principal"}\n`;

    if (proximoService.leader) {
      mensaje += `👤 **Director:** ${proximoService.leader}\n`;
    }

    mensaje += `🎯 **Actividad especial:** ${proximoService.special_activity || "Ninguna"}\n`;

    if (proximoService.notes) {
      mensaje += `📝 **Notas:** ${proximoService.notes}\n`;
    }

    mensaje += `\n¡Prepárate para alabar al Señor! 🙏\n`;

    // Turnos adicionales (máximo 4 más)
    if (uniqueServices.length > 1) {
      mensaje += `\n📋 **También tienes turnos en:**\n`;
      uniqueServices.slice(1, 5).forEach((service) => {
        const fecha = new Date(service.service_date).toLocaleDateString("es-ES");
        const hora = this.formatServiceTime(service.service_date, service.title);
        mensaje += `• ${fecha} - ${hora}\n`;
      });

      if (uniqueServices.length > 5) {
        mensaje += `• ... y ${uniqueServices.length - 5} más\n`;
      }
    }

    return {
      type: "turnos",
      message: mensaje,
      expression: "happy",
    };
  }

  // NUEVO: Filtrar servicios únicos por fecha y hora
  private static filterUniqueServices(services: any[]): any[] {
    const seen = new Set();
    return services.filter((service) => {
      // Crear clave única basada en fecha y título/hora
      const date = new Date(service.service_date).toISOString().split("T")[0];
      const timeKey = service.title || this.extractTimeFromDate(service.service_date);
      const key = `${date}-${timeKey}`;

      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // NUEVO: Extraer hora de la fecha
  private static extractTimeFromDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // NUEVO: Formatear hora del servicio CORREGIDO
  private static formatServiceTime(serviceDate: string, serviceTitle?: string): string {
    // Si el título contiene la hora, usarla
    if (serviceTitle) {
      const timeMatch = serviceTitle.match(/(\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)?)/i);
      if (timeMatch) {
        return timeMatch[1].toUpperCase();
      }

      // Si el título es "08:00 a.m." o similar
      if (serviceTitle.includes("a.m.") || serviceTitle.includes("p.m.")) {
        return serviceTitle;
      }
    }

    // Si no, extraer de la fecha pero formatear correctamente
    const date = new Date(serviceDate);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Convertir a formato 12-horas
    if (hours === 0 && minutes === 0) {
      return "Hora por confirmar";
    }

    const ampm = hours >= 12 ? "p.m." : "a.m.";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");

    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  private static async searchUserInServices(fullName: string, memberData?: any): Promise<BotResponse> {
    try {
      console.log("🔍 Buscando servicios para:", fullName);

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
          message: "🤖 Error consultando la agenda.",
          expression: "worried",
        };
      }

      if (!eventos || eventos.length === 0) {
        return {
          type: "turnos",
          message: "🤖 No hay servicios programados.",
          expression: "happy",
        };
      }

      // Búsqueda flexible pero más específica
      const normalizedName = fullName.toLowerCase();
      const nameParts = normalizedName.split(/\s+/).filter((part) => part.length >= 2);

      const eventosConUsuario = eventos.filter((evento) => {
        const searchText = [
          evento.leader || "",
          evento.description || "",
          evento.notes || "",
          evento.title || "",
          evento.special_activity || "",
        ]
          .join(" ")
          .toLowerCase();

        const normalizedSearch = searchText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Buscar coincidencia más específica
        return nameParts.some((part) => {
          const normalizedPart = part.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const regex = new RegExp(`\\b${normalizedPart}\\b`, "i");
          return regex.test(normalizedSearch) || searchText.includes(part);
        });
      });

      console.log("✅ Eventos con usuario encontrados:", eventosConUsuario.length);

      if (eventosConUsuario.length > 0) {
        return this.formatUserTurnosResponse(fullName, memberData, eventosConUsuario);
      }

      return {
        type: "turnos",
        message: `🤖 **Hola ${fullName}!**\n\nNo encontré turnos programados para ti.\n\n💡 Consulta con tu líder de grupo.`,
        expression: "worried",
      };
    } catch (error) {
      console.error("💥 Error buscando en servicios:", error);
      return {
        type: "turnos",
        message: "🤖 Error consultando los turnos.",
        expression: "worried",
      };
    }
  }

  private static formatUserTurnosResponse(fullName: string, memberData: any, eventos: any[]): BotResponse {
    // Filtrar servicios únicos
    const uniqueEventos = this.filterUniqueServices(eventos).slice(0, 6); // Máximo 6 servicios

    const proximoEvento = uniqueEventos[0];
    const fecha = new Date(proximoEvento.service_date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // CORREGIDO: Usar el nuevo formato de hora
    const serviceTime = this.formatServiceTime(proximoEvento.service_date, proximoEvento.title);

    let mensaje = `🎵 **¡Hola ${fullName}!**\n\n`;

    if (memberData) {
      mensaje += `🎤 **Cargo:** ${memberData.cargo || "No especificado"}\n`;
      if (memberData.voz_instrumento) {
        mensaje += `🎵 **Voz/Instrumento:** ${memberData.voz_instrumento}\n`;
      }
      mensaje += `\n`;
    }

    // Formato mejorado con nombre destacado
    mensaje += `De acuerdo con nuestra base de datos el siguiente turno de **<span style="color: #ef4444">${fullName}</span>** es:\n\n`;
    mensaje += `⏰ **Hora:** ${serviceTime}\n`;
    mensaje += `📅 **Día:** ${fecha}\n`;
    mensaje += `📍 **Lugar:** ${proximoEvento.location || "Templo Principal"}\n`;

    if (proximoEvento.leader) {
      mensaje += `👤 **Director:** ${proximoEvento.leader}\n`;
    }

    mensaje += `🎯 **Actividad especial:** ${proximoEvento.special_activity || "Ninguna"}\n`;

    if (proximoEvento.notes) {
      mensaje += `📝 **Notas:** ${proximoEvento.notes}\n`;
    }

    mensaje += `\n¡Prepárate para alabar al Señor! 🙏`;

    // Turnos adicionales (máximo 5 más)
    if (uniqueEventos.length > 1) {
      mensaje += `\n\n📋 **También tienes turnos en:**\n`;
      uniqueEventos.slice(1, 6).forEach((evento) => {
        const fecha = new Date(evento.service_date).toLocaleDateString("es-ES");
        const hora = this.formatServiceTime(evento.service_date, evento.title);
        mensaje += `• ${fecha} - ${hora}\n`;
      });

      if (uniqueEventos.length > 6) {
        mensaje += `• ... y ${uniqueEventos.length - 6} más\n`;
      }
    }

    return {
      type: "turnos",
      message: mensaje,
      expression: "happy",
    };
  }

  private static async getEnsayosResponse(): Promise<BotResponse> {
    try {
      const today = new Date();
      const currentDay = today.getDay();
      let nextFriday: Date;

      if (currentDay === 5) {
        // Si hoy es viernes, mostrar el próximo viernes
        nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + 7);
      } else {
        const daysUntilFriday = (5 - currentDay + 7) % 7;
        nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
      }

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
        expression: "happy",
      };
    } catch (error) {
      console.error("Error generando respuesta de ensayos:", error);
      return {
        type: "ensayos",
        message: "🤖 Los ensayos son todos los viernes de 07:00 p.m. a 09:00 p.m.",
        expression: "worried",
      };
    }
  }

  // Normalize text removing accents for comparison
  private static normalizeText(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // Detect song purpose from message keywords
  private static detectSongPurpose(message: string): SongPurpose {
    const normalized = this.normalizeText(message);
    if (/ofrenda|ofrendas/.test(normalized)) return "offering";
    if (/santa\s*cena|santa\s*comuni[oó]n|comuni[oó]n|comunion/.test(normalized)) return "communion";
    return "worship";
  }

  // Remove purpose keywords from search query
  private static removePurposeKeywords(query: string): string {
    return query
      .replace(/\b(ofrendas?|santa\s*cena|santa\s*comuni[oó]n|comuni[oó]n|comunion)\b/gi, "")
      .trim();
  }

  // Get purpose label in Spanish
  private static getPurposeLabel(purpose: SongPurpose): string {
    switch (purpose) {
      case "offering": return "🎵 Ofrendas";
      case "communion": return "🍷 Santa Comunión";
      default: return "🎶 Alabanza";
    }
  }

  private static async handleCancionesBuscar(query: string, userId?: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando canciones con query:", query);

      // Detect purpose from the message
      const songPurpose = this.detectSongPurpose(query);
      console.log("ARCANA propósito detectado:", songPurpose);

      // Extraer términos de búsqueda (removing purpose keywords too)
      let searchTerms = query.replace(/canción|cancion|canciones|buscar|repertorio|música|musica|song/gi, "").trim();
      searchTerms = this.removePurposeKeywords(searchTerms).trim();

      if (!searchTerms) {
        return {
          type: "canciones",
          message: '🤖 Para buscar canciones, especifica el nombre. Ejemplo: "ARCANA buscar alabanza"',
          expression: "worried",
        };
      }

      // First try exact ilike search
      let { data: canciones, error } = await supabase
        .from("songs")
        .select("*")
        .or(`title.ilike.%${searchTerms}%,artist.ilike.%${searchTerms}%`)
        .eq("is_active", true)
        .limit(5);

      if (error) {
        console.error("Error buscando canciones:", error);
        return {
          type: "canciones",
          message: "🤖 Error buscando canciones.",
          expression: "worried",
        };
      }

      // If no results, try accent-insensitive search by fetching more songs and filtering locally
      if (!canciones || canciones.length === 0) {
        const normalizedSearch = this.normalizeText(searchTerms);
        const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length >= 2);
        
        // Fetch a broader set and filter client-side for accent-insensitive matching
        const { data: allSongs } = await supabase
          .from("songs")
          .select("*")
          .eq("is_active", true)
          .limit(500);

        if (allSongs) {
          canciones = allSongs.filter(song => {
            const normalizedTitle = this.normalizeText(song.title || "");
            const normalizedArtist = this.normalizeText(song.artist || "");
            // All search words must appear in title or artist
            return searchWords.every(word => 
              normalizedTitle.includes(word) || normalizedArtist.includes(word)
            );
          }).slice(0, 5);
        }
      }

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 No encontré canciones con "${searchTerms}".`,
          expression: "worried",
        };
      }

      // Obtener próximo servicio para el usuario si es director
      let nextService = null;
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();

        if (profile?.full_name) {
          const { data: service } = await supabase
            .from("services")
            .select("id, service_date, title")
            .ilike("leader", `%${profile.full_name}%`)
            .gte("service_date", new Date().toISOString().split("T")[0])
            .order("service_date", { ascending: true })
            .limit(1)
            .maybeSingle();
          nextService = service;
        }
      }

      // Get director's preferred keys if userId available
      let directorKeys: Record<string, string> = {};
      if (userId) {
        const songIds = canciones.map(c => c.id);
        const { data: keys } = await supabase
          .from("director_song_keys")
          .select("song_id, preferred_key")
          .eq("director_id", userId)
          .in("song_id", songIds);
        if (keys) {
          keys.forEach(k => { directorKeys[k.song_id] = k.preferred_key; });
        }
      }

      const serviceDate = nextService?.service_date;

      const purposeLabel = songPurpose !== "worship" ? ` para ${this.getPurposeLabel(songPurpose)}` : "";
      let mensaje = `🎵 **Encontré ${canciones.length} canción(es)${purposeLabel}:**\n\n`;

      canciones.forEach((cancion, index) => {
        mensaje += `${index + 1}. **${cancion.title}**\n`;
        if (cancion.artist) mensaje += `🎤 ${cancion.artist}\n`;
        if (cancion.genre) mensaje += `🎼 ${cancion.genre}\n`;
        const dirKey = directorKeys[cancion.id];
        if (dirKey) {
          mensaje += `🎹 Tono: ${cancion.key_signature || 'N/A'} (★ Tu preferido: ${dirKey})\n`;
        } else if (cancion.key_signature) {
          mensaje += `🎹 Tono: ${cancion.key_signature}\n`;
        }
        mensaje += "\n";
      });

      // Agregar botones si el usuario es director y tiene próximo servicio
      const actions: BotAction[] = [];
      if (nextService) {
        const purposeText = songPurpose !== "worship" ? ` como canción de ${this.getPurposeLabel(songPurpose)}` : "";
        mensaje += `💡 **Haz clic en los botones para agregar${purposeText} al servicio del ${new Date(serviceDate!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}**\n\n`;

        actions.push(
          ...canciones.map(
            (c: any): BotAction => ({
              type: "select_song" as const,
              songId: c.id,
              songName: c.title,
              serviceDate: nextService.service_date,
              serviceId: nextService.id,
              coverImageUrl: c.cover_image_url || null,
              keySignature: directorKeys[c.id] || c.key_signature || null,
              songPurpose: songPurpose,
            }),
          ),
        );
      } else {
        mensaje += "💡 **Opciones disponibles:**\n";
        mensaje += "• 📖 Ver Repertorio Completo\n";
        mensaje += "• Solo los directores pueden agregar canciones a los servicios\n";
      }

      return {
        type: "canciones",
        message: mensaje,
        expression: "happy",
        actions: actions.length > 0 ? actions : undefined,
      };
    } catch (error) {
      console.error("Error buscando canciones:", error);
      return {
        type: "canciones",
        message: "🤖 Error buscando canciones.",
        expression: "worried",
      };
    }
  }

  private static async handleCancionesSeleccionar(query: string, userId?: string): Promise<BotResponse> {
    try {
      console.log("ARCANA procesando selección de canción:", query);

      // Detect purpose from the message
      const songPurpose = this.detectSongPurpose(query);

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
          nombreCancion = this.removePurposeKeywords(match[1].trim());
          break;
        }
      }

      if (!nombreCancion || nombreCancion.length < 3) {
        return {
          type: "canciones",
          message:
            '🤖 Lo siento, para seleccionar una canción especifica el nombre completo. Ejemplo: "ARCANA seleccionar Como Lluvia para próximo servicio"',
          expression: "worried",
        };
      }

      // Buscar la canción en el repertorio - first try ilike, then accent-insensitive
      let { data: canciones, error } = await supabase
        .from("songs")
        .select("*")
        .or(`title.ilike.%${nombreCancion}%,artist.ilike.%${nombreCancion}%`)
        .eq("is_active", true)
        .limit(3);

      // If no results, try accent-insensitive search
      if ((!canciones || canciones.length === 0) && !error) {
        const normalizedSearch = this.normalizeText(nombreCancion);
        const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length >= 2);
        
        const { data: allSongs } = await supabase
          .from("songs")
          .select("*")
          .eq("is_active", true)
          .limit(500);

        if (allSongs) {
          canciones = allSongs.filter(song => {
            const normalizedTitle = this.normalizeText(song.title || "");
            return searchWords.every(word => normalizedTitle.includes(word));
          }).slice(0, 3);
        }
      }

      if (error) {
        console.error("Error buscando canción:", error);
        return {
          type: "canciones",
          message: "🤖 Lo siento, hubo un error buscando la canción. Intenta nuevamente.",
          expression: "worried",
        };
      }

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 Lo siento, no encontré la canción "${nombreCancion}" en nuestro repertorio.\n\n💡 Puedes:\n• 🔍 Buscar en el Repertorio\n• ➕ Agregar Nueva Canción`,
          expression: "worried",
        };
      }

      // Obtener próximo servicio para el usuario si es director
      let nextService = null;
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();

        if (profile?.full_name) {
          const { data: service } = await supabase
            .from("services")
            .select("id, service_date, title")
            .ilike("leader", `%${profile.full_name}%`)
            .gte("service_date", new Date().toISOString().split("T")[0])
            .order("service_date", { ascending: true })
            .limit(1)
            .maybeSingle();
          nextService = service;
        }
      }

      const serviceDate = nextService?.service_date;

      // Si hay múltiples canciones, mostrar opciones con botones
      if (canciones.length > 1) {
        let mensaje = `🎵 Encontré ${canciones.length} canciones similares a "${nombreCancion}":\n\n`;
        canciones.forEach((cancion, index) => {
          mensaje += `${index + 1}. **${cancion.title}**`;
          if (cancion.artist) mensaje += ` - ${cancion.artist}`;
          mensaje += `\n`;
        });

        mensaje += `\n💡 Haz clic en el botón para agregarla al próximo servicio${serviceDate ? ` (${new Date(serviceDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })})` : ""}.`;

        const actions: BotAction[] = nextService
          ? canciones.map((c: any) => ({
              type: "select_song" as const,
              songId: c.id,
              songName: c.title,
              serviceDate: nextService.service_date,
              serviceId: nextService.id,
              coverImageUrl: c.cover_image_url || null,
              keySignature: c.key_signature || null,
              songPurpose: songPurpose,
            }))
          : [];

        return {
          type: "canciones",
          message: mensaje,
          expression: "happy",
          actions,
        };
      }

      // Una sola canción encontrada
      const cancion = canciones[0];
      let mensaje = `🎵 **Canción encontrada:** ${cancion.title}\n`;
      if (cancion.artist) mensaje += `🎤 **Artista:** ${cancion.artist}\n`;
      if (cancion.genre) mensaje += `🎼 **Género:** ${cancion.genre}\n`;
      if (cancion.key_signature) mensaje += `🎹 **Tono:** ${cancion.key_signature}\n\n`;

      if (nextService) {
        mensaje += `💡 Haz clic en el botón para agregarla al servicio del ${new Date(serviceDate!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}.`;

        const actions: BotAction[] = [
          {
            type: "select_song",
            songId: cancion.id,
            songName: cancion.title,
            serviceDate: nextService.service_date,
            serviceId: nextService.id,
            coverImageUrl: cancion.cover_image_url || null,
            keySignature: cancion.key_signature || null,
            songPurpose: songPurpose,
          },
        ];

        return {
          type: "canciones",
          message: mensaje,
          expression: "happy",
          actions,
        };
      } else {
        mensaje += "💡 Para agregar canciones a servicios, necesitas ser director de un servicio próximo.";
        return {
          type: "canciones",
          message: mensaje,
          expression: "thinking",
        };
      }
    } catch (error) {
      console.error("Error en selección de canción:", error);
      return {
        type: "canciones",
        message:
          "🤖 Lo siento, hubo un error procesando tu solicitud. Para seleccionar canciones visita la Agenda Ministerial.",
        expression: "worried",
      };
    }
  }

  private static async handleBirthdayQuery(query: string): Promise<BotResponse> {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;

      // Mapeo de nombres de meses
      const monthMap: { [key: string]: number } = {
        enero: 1,
        febrero: 2,
        marzo: 3,
        abril: 4,
        mayo: 5,
        junio: 6,
        julio: 7,
        agosto: 8,
        septiembre: 9,
        octubre: 10,
        noviembre: 11,
        diciembre: 12,
      };

      let targetMonth = currentMonth;

      // Determinar el mes objetivo
      for (const [monthName, monthNumber] of Object.entries(monthMap)) {
        if (query.includes(monthName)) {
          targetMonth = monthNumber;
          break;
        }
      }

      const members = await this.cache.getMembers();

      const monthBirthdays = members
        .filter((member) => {
          if (!member.fecha_nacimiento) return false;

          try {
            let birthDate: Date;
            if (typeof member.fecha_nacimiento === "string") {
              if (member.fecha_nacimiento.includes("/")) {
                const [day, month, year] = member.fecha_nacimiento.split("/").map(Number);
                birthDate = new Date(2000 + year, month - 1, day);
              } else {
                birthDate = new Date(member.fecha_nacimiento);
              }
            } else {
              birthDate = new Date(member.fecha_nacimiento);
            }

            return birthDate.getMonth() + 1 === targetMonth;
          } catch (e) {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const getDate = (member: any) => {
              if (typeof member.fecha_nacimiento === "string" && member.fecha_nacimiento.includes("/")) {
                const [day] = member.fecha_nacimiento.split("/").map(Number);
                return day;
              }
              return new Date(member.fecha_nacimiento).getDate();
            };
            return getDate(a) - getDate(b);
          } catch (e) {
            return 0;
          }
        });

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

      if (monthBirthdays.length === 0) {
        return {
          type: "general",
          message: `🎂 **Cumpleaños de ${monthNames[targetMonth]}:**\n\n😊 No hay cumpleaños este mes.`,
          expression: "happy",
        };
      }

      let mensaje = `🎂 **Cumpleaños de ${monthNames[targetMonth]}:** 🎉\n\n`;

      monthBirthdays.forEach((member) => {
        try {
          let day: number;
          if (!member.fecha_nacimiento) {
            mensaje += `📅 ? - **${member.nombres} ${member.apellidos}**\n`;
            return;
          }

          // CORREGIDO: Mismo formato que MemberProfile.tsx para evitar desfase de fecha
          if (typeof member.fecha_nacimiento === "string") {
            if (member.fecha_nacimiento.includes("/")) {
              const [d] = member.fecha_nacimiento.split("/").map(Number);
              day = d;
            } else {
              // Formato YYYY-MM-DD - parse manualmente para evitar zona horaria
              const parts = member.fecha_nacimiento.split("-").map(Number);
              day = parts[2]; // día
            }
          } else {
            day = new Date(member.fecha_nacimiento).getDate();
          }
          mensaje += `📅 ${day} - **${member.nombres} ${member.apellidos}**\n`;
        } catch (e) {
          console.error("Error procesando fecha de cumpleaños:", e);
          mensaje += `📅 ? - **${member.nombres} ${member.apellidos}**\n`;
        }
      });

      mensaje += `\n💝 Total: ${monthBirthdays.length} cumpleañero${monthBirthdays.length > 1 ? "s" : ""}`;

      return { type: "general", message: mensaje, expression: "happy" };
    } catch (error) {
      console.error("Error consultando cumpleaños:", error);
      return {
        type: "general",
        message: "🎂 Error consultando cumpleaños.",
        expression: "worried",
      };
    }
  }

  private static getHelpResponse(): BotResponse {
    const ayuda = `🤖 **¡Hola! Soy ARCANA, tu asistente del ministerio ADN Arca de Noé.** ✨

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
• "Cumpleaños de [mes]"

💡 **EJEMPLOS PRÁCTICOS:**
• "ARCANA cuándo me toca cantar"
• "ARCANA buscar Como Lluvia"
• "ARCANA cuándo le toca a Armando Noel"
• "ARCANA próximo ensayo"
• "ARCANA cumpleaños de hoy"
• "ARCANA cumpleaños de noviembre"

📱 **TIPS:**
• Puedes simplemente mencionar "ARCANA" o "@ARCANA"
• Soy tu asistente 24/7 para cualquier duda del ministerio

¡Estoy aquí para servirte! 🙏🎵`;

    return { type: "general", message: ayuda, expression: "happy" };
  }

  private static getDefaultResponse(): BotResponse {
    return {
      type: "general",
      message: '🤖 No entendí tu consulta. Escribe "ARCANA ayuda" para ver las opciones.',
      expression: "worried",
    };
  }

  static async sendBotResponse(roomId: string, response: BotResponse): Promise<void> {
    try {
      const messageData: any = {
        room_id: roomId,
        user_id: null,
        message: response.message,
        is_bot: true,
        message_type: "text",
        is_deleted: false,
        actions: response.actions || null,
      };

      const { error } = await supabase.from("chat_messages").insert([messageData]);

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
