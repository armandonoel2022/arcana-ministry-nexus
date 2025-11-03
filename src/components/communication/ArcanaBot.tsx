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
    if (this.membersCache && (now - this.membersCacheTime) < this.cacheDuration) {
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
}

// Diccionario de nombres comunes y sus variantes
const nameDictionary: { [key: string]: string[] } = {
  "nicolas": ["nicolas", "nicolás", "felix nicolas", "felix nicolás", "felix", "félix"],
  "felix": ["felix", "félix", "felix nicolas", "felix nicolás", "nicolas", "nicolás"],
  "keyla": ["keyla", "keyla yanira", "keyla medrano", "yanira"],
  "armando": ["armando", "armando noel", "noel"],
  "damaris": ["damaris", "damaris castillo"],
  "eliabi": ["eliabi", "eliabi joana", "joana"],
  "roosevelt": ["roosevelt", "roosevelt martinez", "martinez"],
  "denny": ["denny", "denny santana", "denny alberto"],
  "aleida": ["aleida", "aleida batista", "aleida geomar"],
  "ruth": ["ruth", "ruth santana", "ruth esther"],
  "david": ["david", "david santana"],
  "enger": ["enger", "enger julio", "julio"],
  "wilton": ["wilton", "wilton gomez", "gomez"],
  "katherine": ["katherine", "katherine orquidea", "orquidea"],
  "jhoyve": ["jhoyve", "jhoyve shantal", "shantal"]
};

export class ArcanaBot {
  private static cache = ArcanaCache.getInstance();

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
      return this.getHelpResponse();
    }

    // Analizar el tipo de consulta con mejor detección
    const queryType = this.analyzeQueryType(cleanMessage);
    console.log("ARCANA tipo de consulta detectada:", queryType);

    switch (queryType) {
      case 'turnos_propios':
        return await this.handleTurnosQuery(userId);
      
      case 'turnos_otros':
        const userName = this.extractUserName(cleanMessage);
        if (userName) {
          return await this.handleTurnosQueryForUser(userName);
        } else {
          return {
            type: "turnos",
            message: "🤖 ¿Para quién quieres consultar los turnos? Ejemplo: 'ARCANA cuando le toca a Keyla'",
            expression: 'thinking'
          };
        }
      
      case 'ensayos':
        return await this.getEnsayosResponse();
      
      case 'canciones_buscar':
        return await this.handleCancionesBuscar(cleanMessage, userId);
      
      case 'canciones_seleccionar':
        return await this.handleCancionesSeleccionar(cleanMessage);
      
      case 'cumpleanos':
        return await this.handleBirthdayQuery(cleanMessage);
      
      case 'biblico':
        return this.getBibleResponse(cleanMessage);
      
      case 'ayuda':
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
        /mi\s+agenda/
      ],
      turnos_otros: [
        /(cu[áa]ndo\s+)?le\s+toca\s+a\s+([a-záéíóúñü\s]{2,})/,
        /turno\s+(?:de|para)\s+([a-záéíóúñü\s]{2,})/,
        /(?:y\s+)?([a-záéíóúñü\s]{2,})\s+(?:cu[áa]ndo\s+le\s+toca|pr[oó]ximo\s+turno)/,
        /cu[áa]ndo\s+canta\s+([a-záéíóúñü\s]{2,})/
      ],
      ensayos: [
        /ensayo/,
        /ensayos/,
        /pr[áa]ctica/,
        /practicas/,
        /rehearsal/
      ],
      canciones_buscar: [
        /buscar/,
        /canci[óo]n/,
        /canciones/,
        /repertorio/,
        /m[úu]sica/,
        /song/
      ],
      canciones_seleccionar: [
        /seleccionar/,
        /elegir/,
        /a[ñn]adir/,
        /agregar/,
        /para\s+servicio/
      ],
      cumpleanos: [
        /cumplea[ñn]os/,
        /cumple/,
        /fiesta/,
        /natalicio/
      ],
      biblico: [
        /vers[ií]culo/,
        /biblia/,
        /cita\s+b[ií]blica/,
        /palabra/,
        /evangelio/
      ],
      ayuda: [
        /ayuda/,
        /help/,
        /qu[eé]\s+puedes/,
        /opciones/,
        /comandos/
      ]
    };

    for (const [type, typePatterns] of Object.entries(patterns)) {
      for (const pattern of typePatterns) {
        if (pattern.test(message)) {
          return type;
        }
      }
    }

    return 'general';
  }

  private static extractUserName(message: string): string | null {
    // Patrones para extraer nombres
    const patterns = [
      /le\s+toca\s+a\s+([a-záéíóúñü\s]{2,})/i,
      /turno\s+(?:de|para)\s+([a-záéíóúñü\s]{2,})/i,
      /cu[áa]ndo\s+canta\s+([a-záéíóúñü\s]{2,})/i,
      /([a-záéíóúñü\s]{2,})\s+cu[áa]ndo\s+le\s+toca/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim().toLowerCase();
        
        // Filtrar palabras comunes
        const commonWords = [
          "me", "mi", "cuando", "que", "el", "la", "un", "una", "este", 
          "esta", "ese", "esa", "cantar", "toca", "turno", "próximo", 
          "siguiente", "ensayo", "canción", "arcana", "por", "para", 
          "de", "del", "al", "y", "o", "con", "sin", "los", "las", "su"
        ];

        const words = extractedName.split(/\s+/);
        const validWords = words.filter(word => 
          word.length >= 2 && !commonWords.includes(word)
        );

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

      // Buscar miembros que coincidan
      const matchingMembers = members.filter(member => {
        const fullName = `${member.nombres} ${member.apellidos}`.toLowerCase();
        const normalizedFullName = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        return searchTerms.some(term => {
          const normalizedTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return fullName.includes(normalizedTerm) || 
                 normalizedFullName.includes(normalizedTerm) ||
                 member.nombres.toLowerCase().includes(normalizedTerm) ||
                 member.apellidos.toLowerCase().includes(normalizedTerm);
        });
      });

      console.log("Miembros encontrados:", matchingMembers.length);

      if (matchingMembers.length === 0) {
        return {
          type: "turnos",
          message: `🤖 No encontré al integrante "${userName}" en nuestro sistema.\n\n💡 **Sugerencias:**\n• Verifica la ortografía\n• Usa nombre y apellido\n• Consulta la lista de **[Integrantes Activos](/integrantes)**`,
          expression: 'worried',
        };
      }

      // Si hay múltiples coincidencias
      if (matchingMembers.length > 1) {
        const opciones = matchingMembers.map((m, i) => 
          `${i + 1}. **${m.nombres} ${m.apellidos}**`
        ).join("\n");

        return {
          type: "turnos",
          message: `🤖 Encontré varios integrantes:\n\n${opciones}\n\n💡 Especifica mejor el nombre. Ejemplo: "ARCANA cuándo le toca a **${matchingMembers[0].nombres}**"`,
          expression: 'thinking',
        };
      }

      // Un solo resultado
      const member = matchingMembers[0];
      const fullName = `${member.nombres} ${member.apellidos}`;
      return await this.searchUserInServices(fullName, member);
    } catch (error) {
      console.error("Error consultando turnos para otro usuario:", error);
      return {
        type: "turnos",
        message: "🤖 Error consultando los turnos. Intenta nuevamente.",
        expression: 'worried',
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
          expression: 'worried',
        };
      }

      console.log("Perfil encontrado:", profile.full_name);

      // Buscar en members table para obtener más información
      const members = await this.cache.getMembers();
      const memberInfo = members.find(member => {
        const memberFullName = `${member.nombres} ${member.apellidos}`.toLowerCase();
        const profileName = profile.full_name.toLowerCase();
        return memberFullName.includes(profileName) || profileName.includes(member.nombres.toLowerCase());
      });

      console.log("Información del miembro encontrada:", memberInfo);

      // Buscar servicios donde el usuario aparece como líder o en notes
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .or(`leader.ilike.%${profile.full_name}%,notes.ilike.%${profile.full_name}%`)
        .gte("service_date", new Date().toISOString().split("T")[0])
        .order("service_date", { ascending: true })
        .limit(5);

      if (servicesError) {
        console.error("Error obteniendo servicios:", servicesError);
        return {
          type: "turnos",
          message: "🤖 Error consultando los servicios.",
          expression: 'worried',
        };
      }

      console.log("Servicios encontrados:", services?.length || 0);

      if (!services || services.length === 0) {
        return {
          type: "turnos",
          message: "🎵 No tienes turnos programados.\n\n💡 Consulta la agenda ministerial para más información.",
          expression: 'worried',
        };
      }

      // Construir respuesta
      return this.formatTurnosResponse(profile.full_name, memberInfo, services);
    } catch (error) {
      console.error("Error consultando turnos:", error);
      return {
        type: "turnos",
        message: "🤖 Error consultando los turnos.",
        expression: 'worried',
      };
    }
  }

  private static formatTurnosResponse(
    userName: string, 
    memberInfo: any, 
    services: any[]
  ): BotResponse {
    let mensaje = `🎵 **¡Hola ${userName}!**\n\n`;
    
    // Información del miembro
    if (memberInfo) {
      mensaje += `🎤 **Cargo:** ${memberInfo.cargo || 'No especificado'}\n`;
      if (memberInfo.voz_instrumento) {
        mensaje += `🎵 **Voz/Instrumento:** ${memberInfo.voz_instrumento}\n`;
      }
      mensaje += `\n`;
    }

    mensaje += `🎯 **TU PRÓXIMO TURNO:**\n\n`;

    const proximoService = services[0];
    const serviceDate = new Date(proximoService.service_date);
    const formattedDate = serviceDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const serviceTime = new Date(proximoService.service_date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });

    mensaje += `📅 ${serviceTime}\n`;
    mensaje += `🗓️ ${formattedDate}\n`;
    mensaje += `📍 ${proximoService.location || "Templo Principal"}\n`;
    
    if (proximoService.leader) {
      mensaje += `👤 **Director:** ${proximoService.leader}\n`;
    }

    mensaje += `🎯 **Actividad especial:** ${proximoService.special_activity || "Ninguna"}\n`;

    if (proximoService.notes) {
      mensaje += `📝 **Notas:** ${proximoService.notes}\n`;
    }

    mensaje += `\n¡Prepárate para alabar al Señor! 🙏\n`;

    // Turnos adicionales
    if (services.length > 1) {
      mensaje += `\n📋 **También tienes turnos en:**\n`;
      services.slice(1).forEach((service) => {
        const fecha = new Date(service.service_date).toLocaleDateString('es-ES');
        const hora = new Date(service.service_date).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
        mensaje += `• ${fecha} - ${hora}\n`;
      });
    }

    return {
      type: "turnos",
      message: mensaje,
      expression: 'happy',
    };
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
          expression: 'worried',
        };
      }

      if (!eventos || eventos.length === 0) {
        return {
          type: "turnos",
          message: "🤖 No hay servicios programados.",
          expression: 'happy',
        };
      }

      // Búsqueda flexible
      const normalizedName = fullName.toLowerCase();
      const nameParts = normalizedName.split(/\s+/).filter(part => part.length >= 2);

      const eventosConUsuario = eventos.filter((evento) => {
        const searchText = [
          evento.leader || "",
          evento.description || "",
          evento.notes || "",
          evento.title || "",
          evento.special_activity || "",
        ].join(" ").toLowerCase();

        const normalizedSearch = searchText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        return nameParts.some(part => {
          const normalizedPart = part.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedSearch.includes(normalizedPart) || 
                 searchText.includes(part);
        });
      });

      console.log("✅ Eventos con usuario encontrados:", eventosConUsuario.length);

      if (eventosConUsuario.length > 0) {
        return this.formatUserTurnosResponse(fullName, memberData, eventosConUsuario);
      }

      return {
        type: "turnos",
        message: `🤖 **Hola ${fullName}!**\n\nNo encontré turnos programados para ti.\n\n💡 Consulta con tu líder de grupo.`,
        expression: 'worried',
      };
    } catch (error) {
      console.error("💥 Error buscando en servicios:", error);
      return {
        type: "turnos",
        message: "🤖 Error consultando los turnos.",
        expression: 'worried',
      };
    }
  }

  private static formatUserTurnosResponse(fullName: string, memberData: any, eventos: any[]): BotResponse {
    const proximoEvento = eventos[0];
    const fecha = new Date(proximoEvento.service_date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const serviceTime = new Date(proximoEvento.service_date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });

    let mensaje = `🎵 **¡Hola ${fullName}!**\n\n`;

    if (memberData) {
      mensaje += `🎤 **Cargo:** ${memberData.cargo || 'No especificado'}\n`;
      if (memberData.voz_instrumento) {
        mensaje += `🎵 **Voz/Instrumento:** ${memberData.voz_instrumento}\n`;
      }
      mensaje += `\n`;
    }

    mensaje += `🎯 **PRÓXIMO TURNO:**\n\n`;
    mensaje += `📅 ${serviceTime}\n`;
    mensaje += `🗓️ ${fecha}\n`;
    mensaje += `📍 ${proximoEvento.location || "Templo Principal"}\n`;
    
    if (proximoEvento.leader) {
      mensaje += `👤 **Director:** ${proximoEvento.leader}\n`;
    }

    mensaje += `🎯 **Actividad especial:** ${proximoEvento.special_activity || "Ninguna"}\n`;

    if (proximoEvento.notes) {
      mensaje += `📝 **Notas:** ${proximoEvento.notes}\n`;
    }

    mensaje += `\n¡Prepárate para alabar al Señor! 🙏`;

    // Turnos adicionales
    if (eventos.length > 1) {
      mensaje += `\n\n📋 **También tienes turnos en:**\n`;
      eventos.slice(1).forEach((evento) => {
        const fecha = new Date(evento.service_date).toLocaleDateString('es-ES');
        const hora = new Date(evento.service_date).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
        mensaje += `• ${fecha} - ${hora}\n`;
      });
    }

    return {
      type: "turnos",
      message: mensaje,
      expression: 'happy',
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
        expression: 'happy',
      };
    } catch (error) {
      console.error("Error generando respuesta de ensayos:", error);
      return {
        type: "ensayos",
        message: "🤖 Los ensayos son todos los viernes de 07:00 p.m. a 09:00 p.m.",
        expression: 'worried',
      };
    }
  }

  private static async handleCancionesBuscar(query: string, userId?: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando canciones con query:", query);

      // Extraer términos de búsqueda
      const searchTerms = query.replace(/canción|cancion|canciones|buscar|repertorio|música|song/gi, "").trim();

      if (!searchTerms) {
        return {
          type: "canciones",
          message: '🤖 Para buscar canciones, especifica el nombre. Ejemplo: "ARCANA buscar alabanza"',
          expression: 'worried',
        };
      }

      const { data: canciones, error } = await supabase
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
          expression: 'worried',
        };
      }

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 No encontré canciones con "${searchTerms}".`,
          expression: 'worried',
        };
      }

      let mensaje = `🎵 **Encontré ${canciones.length} canción(es):**\n\n`;

      canciones.forEach((cancion, index) => {
        mensaje += `${index + 1}. **${cancion.title}**\n`;
        if (cancion.artist) mensaje += `🎤 ${cancion.artist}\n`;
        if (cancion.genre) mensaje += `🎼 ${cancion.genre}\n`;
        if (cancion.key_signature) mensaje += `🎹 Tono: ${cancion.key_signature}\n`;
        mensaje += "\n";
      });

      return {
        type: "canciones",
        message: mensaje,
        expression: 'happy',
      };
    } catch (error) {
      console.error("Error buscando canciones:", error);
      return {
        type: "canciones",
        message: "🤖 Error buscando canciones.",
        expression: 'worried',
      };
    }
  }

  private static async handleCancionesSeleccionar(query: string): Promise<BotResponse> {
    return {
      type: "canciones",
      message: "🤖 Para seleccionar canciones visita la sección de Repertorio en la agenda ministerial.",
      expression: 'thinking',
    };
  }

  private static async handleBirthdayQuery(query: string): Promise<BotResponse> {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;

      // Mapeo de nombres de meses
      const monthMap: { [key: string]: number } = {
        enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
        julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
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
        .filter(member => {
          if (!member.fecha_nacimiento) return false;
          
          try {
            let birthDate: Date;
            if (typeof member.fecha_nacimiento === 'string') {
              if (member.fecha_nacimiento.includes('/')) {
                const [day, month, year] = member.fecha_nacimiento.split('/').map(Number);
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
              if (typeof member.fecha_nacimiento === 'string' && member.fecha_nacimiento.includes('/')) {
                const [day] = member.fecha_nacimiento.split('/').map(Number);
                return day;
              }
              return new Date(member.fecha_nacimiento).getDate();
            };
            return getDate(a) - getDate(b);
          } catch (e) {
            return 0;
          }
        });

      const monthNames = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                         "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      if (monthBirthdays.length === 0) {
        return {
          type: "general",
          message: `🎂 **Cumpleaños de ${monthNames[targetMonth]}:**\n\n😊 No hay cumpleaños este mes.`,
          expression: 'happy',
        };
      }

      let mensaje = `🎂 **Cumpleaños de ${monthNames[targetMonth]}:** 🎉\n\n`;

      monthBirthdays.forEach((member) => {
        try {
          let day: number;
          if (typeof member.fecha_nacimiento === 'string' && member.fecha_nacimiento.includes('/')) {
            const [d] = member.fecha_nacimiento.split('/').map(Number);
            day = d;
          } else {
            day = new Date(member.fecha_nacimiento).getDate();
          }
          mensaje += `📅 ${day} - **${member.nombres} ${member.apellidos}**\n`;
        } catch (e) {
          mensaje += `📅 ? - **${member.nombres} ${member.apellidos}**\n`;
        }
      });

      mensaje += `\n💝 Total: ${monthBirthdays.length} cumpleañero${monthBirthdays.length > 1 ? "s" : ""}`;

      return { type: "general", message: mensaje, expression: 'happy' };
    } catch (error) {
      console.error("Error consultando cumpleaños:", error);
      return {
        type: "general",
        message: "🎂 Error consultando cumpleaños.",
        expression: 'worried',
      };
    }
  }

  private static getBibleResponse(query: string): BotResponse {
    return {
      type: "general",
      message: `📖 **Consultas bíblicas:**\n\nVisita el Módulo Espiritual para versículos y reflexiones.\n\n"Lámpara es a mis pies tu palabra" - Salmo 119:105 🙏`,
      expression: 'thinking',
    };
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

📖 **BIBLIA Y ESPIRITUAL**
• "Versículo del día"
• "Cita bíblica sobre [tema]"

💡 **EJEMPLOS PRÁCTICOS:**
• "ARCANA cuándo me toca cantar"
• "ARCANA buscar Como Lluvia"
• "ARCANA cuándo le toca a Armando Noel"
• "ARCANA próximo ensayo"
• "ARCANA cumpleaños de hoy"
• "ARCANA cumpleaños de noviembre"
• "ARCANA versículo del día"

¡Estoy aquí para servirte! 🙏🎵`;

    return { type: "general", message: ayuda, expression: 'happy' };
  }

  private static getDefaultResponse(): BotResponse {
    return {
      type: "general",
      message: '🤖 No entendí tu consulta. Escribe "ARCANA ayuda" para ver las opciones.',
      expression: 'worried',
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