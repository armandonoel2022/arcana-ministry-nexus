import { supabase } from "@/integrations/supabase/client";

export interface BotAction {
  type: 'select_song';
  songId: string;
  songName: string;
  serviceDate?: string;
  serviceId?: string;
}

interface BotResponse {
  type: "turnos" | "ensayos" | "canciones" | "general" | "biblico";
  message: string;
  expression?: 'thinking' | 'happy' | 'worried';
  actions?: BotAction[];
}

// Cache para miembros con expiración de 5 minutos
interface CacheEntry {
  data: any;
  timestamp: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

export class ArcanaBot {
  private static cache = CacheManager.getInstance();

  // Diccionario mejorado de nombres con variantes
  private static nameDictionary: { [key: string]: string } = {
    'massy': 'Damaris Castillo',
    'damaris': 'Damaris Castillo',
    'damaris castillo': 'Damaris Castillo',
    'armando': 'Armando Noel',
    'armando noel': 'Armando Noel',
    'noel': 'Armando Noel',
    'carlos': 'Carlos Rodriguez',
    'carlos rodriguez': 'Carlos Rodriguez',
    'maria': 'Maria Garcia',
    'maria garcia': 'Maria Garcia',
    'juan': 'Juan Perez',
    'juan perez': 'Juan Perez'
  };

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

    // Detectar consultas bíblicas primero
    if (this.isBibleQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta bíblica");
      return await this.handleBibleQuery(cleanMessage);
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
      return await this.handleCancionesQuery(cleanMessage, userId);
    } else if (this.isSeleccionarCancionQuery(cleanMessage)) {
      console.log("ARCANA detectó consulta de selección de canción");
      return await this.handleSeleccionarCancionQuery(cleanMessage);
    } else {
      console.log("ARCANA detectó consulta general");
      return this.handleGeneralQuery(cleanMessage);
    }
  }

  // MEJORA: Detección mejorada de consultas bíblicas
  private static isBibleQuery(message: string): boolean {
    const biblePatterns = [
      /vers[ií]culo\s+(?:del\s+)?d[ií]a/,
      /vers[ií]culo\s+(?:aleatorio|random)/,
      /cita\s+b[ií]blica/,
      /biblia|b[ií]blico/,
      /palabra\s+de\s+dios/,
      /(?:buscar|encontrar)\s+vers[ií]culo/,
      /tema\s+(?:b[ií]blico|espiritual)/,
      /(?:amor|fe|esperanza|paz|gozo|paciencia)\s+(?:en\s+)?la\s+biblia/
    ];

    return biblePatterns.some(pattern => pattern.test(message));
  }

  // MEJORA: Manejo de consultas bíblicas con categorías específicas
  private static async handleBibleQuery(query: string): Promise<BotResponse> {
    try {
      // Categorizar la consulta bíblica
      if (this.isBibleDailyQuery(query)) {
        return await this.getRandomVerse();
      } else if (this.isBibleSpecificQuery(query)) {
        const reference = this.extractBibleReference(query);
        if (reference) {
          return await this.getSpecificVerse(reference);
        }
      } else if (this.isBibleSearchQuery(query)) {
        const topic = this.extractBibleTopic(query);
        if (topic) {
          return await this.searchVersesByTopic(topic);
        }
      }

      // Por defecto, versículo del día
      return await this.getRandomVerse();
    } catch (error) {
      console.error("Error en consulta bíblica:", error);
      return {
        type: "biblico",
        message: "📖 Lo siento, hubo un error consultando la Biblia. Por favor intenta nuevamente.\n\n💡 Puedes intentar con: \"ARCANA versículo del día\" o \"ARCANA Juan 3:16\"",
        expression: 'worried'
      };
    }
  }

  private static isBibleDailyQuery(message: string): boolean {
    return /vers[ií]culo\s+(?:del\s+)?d[ií]a|vers[ií]culo\s+aleatorio|palabra\s+de\s+hoy/i.test(message);
  }

  private static isBibleSpecificQuery(message: string): boolean {
    return /(?:[0-9]?\s*[a-záéíóúñ]+\s+[0-9]+:[0-9]+)|(?:vers[ií]culo\s+[a-záéíóúñ0-9\s:]+)/i.test(message);
  }

  private static isBibleSearchQuery(message: string): boolean {
    return /(?:buscar|encontrar|sobre|acerca\s+de)\s+[a-záéíóúñ]+|tema\s+[a-záéíóúñ]+/i.test(message);
  }

  private static extractBibleReference(message: string): string | null {
    const patterns = [
      /(?:[0-9]?\s*[a-záéíóúñ]+\s+[0-9]+:[0-9]+)/i,
      /vers[ií]culo\s+([a-záéíóúñ0-9\s:]+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0].replace(/vers[ií]culo\s+/i, '').trim();
      }
    }
    return null;
  }

  private static extractBibleTopic(message: string): string | null {
    const patterns = [
      /(?:buscar|encontrar|sobre|acerca\s+de|tema)\s+([a-záéíóúñ\s]+)/i,
      /(amor|fe|esperanza|paz|gozo|paciencia|fe|caridad|humildad)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  // MEJORA: Integración con API Bíblica Externa
  private static async getRandomVerse(): Promise<BotResponse> {
    try {
      const cacheKey = 'bible_random_verse';
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log("ARCANA usando versículo en cache");
        return cached;
      }

      const response = await fetch('https://bible-api.com/?random=verse');
      
      if (!response.ok) {
        throw new Error(`Error en API bíblica: ${response.status}`);
      }

      const data = await response.json();
      
      let message = `📖 **Versículo del Día** 🙏\n\n`;
      message += `"${data.text}"\n\n`;
      message += `**${data.reference}**\n\n`;
      message += `💫 *Que la Palabra de Dios guíe tu día*`;

      const result: BotResponse = {
        type: "biblico",
        message,
        expression: 'happy'
      };

      // Cache por 5 minutos
      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error("Error obteniendo versículo aleatorio:", error);
      // Versículo de respaldo
      return {
        type: "biblico",
        message: `📖 **Versículo del Día** 🙏\n\n"Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."\n\n**Juan 3:16**\n\n💫 *Que la Palabra de Dios guíe tu día*`,
        expression: 'happy'
      };
    }
  }

  private static async getSpecificVerse(reference: string): Promise<BotResponse> {
    try {
      const cacheKey = `bible_verse_${reference}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log("ARCANA usando versículo específico en cache");
        return cached;
      }

      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
      
      if (!response.ok) {
        throw new Error(`Error en API bíblica: ${response.status}`);
      }

      const data = await response.json();
      
      let message = `📖 **${data.reference}** 🙏\n\n`;
      message += `"${data.text}"\n\n`;
      message += `📚 *${data.verses.length} versículo${data.verses.length > 1 ? 's' : ''} encontrado${data.verses.length > 1 ? 's' : ''}*`;

      const result: BotResponse = {
        type: "biblico",
        message,
        expression: 'happy'
      };

      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error("Error obteniendo versículo específico:", error);
      return {
        type: "biblico",
        message: `📖 Lo siento, no pude encontrar el versículo "${reference}".\n\n💡 Verifica la referencia e intenta nuevamente. Ejemplo: "ARCANA Juan 3:16"`,
        expression: 'worried'
      };
    }
  }

  private static async searchVersesByTopic(topic: string): Promise<BotResponse> {
    try {
      const cacheKey = `bible_topic_${topic}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log("ARCANA usando búsqueda por tema en cache");
        return cached;
      }

      // Para búsqueda por temas, usamos un enfoque más simple
      const topicVerses: { [key: string]: string } = {
        'amor': '1 Corintios 13:4-7',
        'fe': 'Hebreos 11:1',
        'esperanza': 'Romanos 15:13',
        'paz': 'Filipenses 4:7',
        'gozo': 'Filipenses 4:4',
        'paciencia': 'Romanos 12:12',
        'fe': 'Marcos 11:22-24',
        'caridad': '1 Corintios 13:13',
        'humildad': 'Filipenses 2:3-4'
      };

      const verseRef = topicVerses[topic.toLowerCase()] || 'Juan 3:16';
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(verseRef)}`);
      
      if (!response.ok) {
        throw new Error(`Error en API bíblica: ${response.status}`);
      }

      const data = await response.json();
      
      let message = `📖 **Sobre ${topic}** 🙏\n\n`;
      message += `"${data.text}"\n\n`;
      message += `**${data.reference}**\n\n`;
      message += `💡 *¿Necesitas más versículos sobre ${topic}? Visita el Módulo Espiritual*`;

      const result: BotResponse = {
        type: "biblico",
        message,
        expression: 'happy'
      };

      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error("Error buscando versículos por tema:", error);
      return {
        type: "biblico",
        message: `📖 **Sobre ${topic}** 🙏\n\n"Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor."\n\n**1 Corintios 13:13**\n\n💡 *Visita el Módulo Espiritual para más versículos*`,
        expression: 'happy'
      };
    }
  }

  // MEJORA: Búsqueda de nombres mejorada con diccionario
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

    // Verificar en el diccionario de nombres primero
    const normalizedMessage = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [key, fullName] of Object.entries(this.nameDictionary)) {
      if (normalizedMessage.includes(key.toLowerCase())) {
        console.log("ARCANA encontró nombre en diccionario:", fullName);
        return fullName;
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
          "de", "del", "al", "y", "o", "u", "con", "sin", "los", "las", "le", "lo"
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

  // MEJORA: Sistema de cache para miembros
  private static async handleTurnosQueryForUser(userName: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando turnos para:", userName);

      const cacheKey = `turnos_${userName.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log("ARCANA usando cache para turnos de:", userName);
        return cached;
      }

      // Búsqueda más flexible de miembros
      const searchTerms = userName
        .toLowerCase()
        .split(" ")
        .filter((term) => term.length > 2)
        .map((term) => term.normalize("NFD").replace(/[\u0300-\u036f]/g, "")); // Remover acentos

      let query = supabase.from("members").select("nombres, apellidos, email, photo_url").eq("is_active", true);

      // Construir condiciones de búsqueda
      const searchConditions = [];
      for (const term of searchTerms) {
        searchConditions.push(`nombres.ilike.%${term}%`);
        searchConditions.push(`apellidos.ilike.%${term}%`);
      }

      const { data: members, error } = await query.or(searchConditions.join(",")).limit(5);

      if (error) throw error;

      if (!members || members.length === 0) {
        const response: BotResponse = {
          type: "turnos",
          message: `🤖 Lo siento, no encontré al integrante "${userName}" en nuestro sistema.\n\n💡 **Sugerencias:**\n• Verifica la ortografía del nombre\n• Usa nombre y apellido si es posible\n• Consulta la lista de **[Integrantes Activos](/integrantes)**`,
          expression: 'worried',
        };
        return response;
      }

      // Si hay múltiples coincidencias
      if (members.length > 1) {
        const opciones = members.map((m, i) => `${i + 1}. **${m.nombres} ${m.apellidos}**`).join("\n");

        const response: BotResponse = {
          type: "turnos",
          message: `🤖 Encontré varios integrantes:\n\n${opciones}\n\n💡 Por favor especifica mejor el nombre. Ejemplo: "ARCANA cuándo le toca a **${members[0].nombres} ${members[0].apellidos.split(" ")[0]}**"`,
          expression: 'thinking',
        };
        return response;
      }

      // Un solo resultado
      const member = members[0];
      const fullName = `${member.nombres} ${member.apellidos}`;
      const response = await this.searchUserInServices(fullName);
      
      // Cachear el resultado
      this.cache.set(cacheKey, response);
      return response;
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

  // MEJORA: Función para obtener foto de usuario
  static async getUserPhoto(userId: string): Promise<string | null> {
    try {
      const cacheKey = `user_photo_${userId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Buscar en members por user_id
      const { data: member, error } = await supabase
        .from("members")
        .select("photo_url")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error obteniendo foto de usuario:", error);
        return null;
      }

      const photoUrl = member?.photo_url || null;
      
      if (photoUrl) {
        this.cache.set(cacheKey, photoUrl);
      }

      return photoUrl;
    } catch (error) {
      console.error("Error en getUserPhoto:", error);
      return null;
    }
  }

  // MEJORA: Procesamiento de notas de voz
  static async processVoiceMessage(audioBlob: Blob): Promise<string> {
    try {
      console.log("ARCANA procesando mensaje de voz");

      // Simulación de STT (Speech-to-Text)
      // En un entorno real, aquí integrarías con Google Speech-to-Text, Azure Cognitive Services, etc.
      
      // Por ahora, simulamos el procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En producción, reemplazar con:
      // const transcription = await realSTTService.transcribe(audioBlob);
      
      const simulatedTranscription = "Este es un mensaje de voz simulado. En producción se integrará con un servicio real de STT.";
      
      console.log("ARCANA transcripción simulada:", simulatedTranscription);
      return simulatedTranscription;

    } catch (error) {
      console.error("Error procesando mensaje de voz:", error);
      throw new Error("No se pudo procesar el mensaje de voz. Por favor intenta nuevamente.");
    }
  }

  // MEJORA: Corrección de horarios - formato mejorado
  private static formatServiceTime(timeString: string | null): string {
    if (!timeString) return "Por confirmar";

    // Eliminar ":00" si es exactamente la hora
    let cleanedTime = timeString.replace(/:00$/, '');
    
    // Convertir a formato 12 horas si es necesario
    if (cleanedTime.includes(':')) {
      const [hours, minutes] = cleanedTime.split(':').map(Number);
      const period = hours >= 12 ? 'p.m.' : 'a.m.';
      const twelveHour = hours % 12 || 12;
      return `${twelveHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    return cleanedTime;
  }

  // MEJORA: En handleTurnosQuery y searchUserInServices, usar el formato mejorado
  private static async searchUserInServices(fullName: string): Promise<BotResponse> {
    try {
      console.log("Buscando servicios para:", fullName);

      const cacheKey = `services_${fullName.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log("ARCANA usando cache para servicios de:", fullName);
        return cached;
      }

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
          message: "🤖 Lo siento, hubo un error consultando la agenda ministerial. Intenta nuevamente.",
          expression: 'worried',
        };
      }

      console.log("Total de eventos encontrados:", eventos?.length || 0);

      if (!eventos || eventos.length === 0) {
        const response: BotResponse = {
          type: "turnos",
          message: "🤖 No hay servicios programados en la agenda ministerial.",
          expression: 'happy',
        };
        return response;
      }

      // Búsqueda más inteligente en los eventos
      const eventosConUsuario = eventos.filter((evento) => {
        const searchText = [
          evento.leader || "",
          evento.description || "",
          evento.notes || "",
          evento.title || "", // MEJORA: Priorizar title
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

        // MEJORA: Usar formato de hora mejorado
        if (proximoEvento.service_time) {
          mensaje += `\n⏰ Hora: ${this.formatServiceTime(proximoEvento.service_time)}`;
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

        const response: BotResponse = {
          type: "turnos",
          message: mensaje,
          expression: 'thinking',
        };

        this.cache.set(cacheKey, response);
        return response;
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

        const response: BotResponse = {
          type: "turnos",
          message: `🎵 **Hola ${fullName}!**\n\nTu último turno registrado fue:\n\n📅 **${ultimoEvento.title}**\n🗓️ ${fecha}\n📍 ${ultimoEvento.location || "Ubicación por confirmar"}\n\n💡 No tienes turnos futuros programados. Consulta con tu líder de grupo para próximos servicios.`,
          expression: 'thinking',
        };

        this.cache.set(cacheKey, response);
        return response;
      }

      // Si no se encontró ningún evento
      const response: BotResponse = {
        type: "turnos",
        message: `🤖 **Hola ${fullName}!**\n\nLo siento, no encontré turnos programados para ti en los próximos servicios.\n\n💡 **Sugerencias:**\n• Verifica que tu nombre esté correctamente escrito en el sistema\n• Consulta con tu líder de grupo sobre próximas asignaciones\n• Revisa la Agenda Ministerial completa`,
        expression: 'worried',
      };

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error("Error buscando en servicios:", error);
      return {
        type: "turnos",
        message:
          "🤖 Lo siento, hubo un error consultando tus turnos. Intenta nuevamente o consulta directamente la agenda ministerial.",
        expression: 'worried',
      };
    }
  }

  // Resto de los métodos existentes (sin cambios significativos)
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

  private static async handleTurnosQuery(userId: string): Promise<BotResponse> {
    console.log("ARCANA consultando turnos para usuario:", userId);
    try {
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
          message:
            "🤖 Lo siento, no pude identificar tu perfil. Por favor verifica que tu cuenta esté configurada correctamente.",
          expression: 'worried',
        };
      }

      console.log("Perfil obtenido:", profile);

      // Obtener grupos del usuario con instrumento
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
        console.error("Error obteniendo grupos:", groupsError);
        return {
          type: "turnos",
          message:
            "🤖 Lo siento, hubo un error consultando tus grupos. Por favor verifica tu configuración en el sistema.",
          expression: 'worried',
        };
      }

      console.log("Grupos del usuario:", userGroups);

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
        console.error("Error obteniendo servicios:", servicesError);
        return {
          type: "turnos",
          message:
            "🤖 Lo siento, hubo un error consultando los servicios. Por favor intenta nuevamente o consulta la agenda ministerial directamente.",
          expression: 'worried',
        };
      }

      console.log("Servicios encontrados:", services);

      if (!services || services.length === 0) {
        return {
          type: "turnos",
          message:
            "🎵 Actualmente no tienes turnos programados.\n\n💡 Consulta la agenda ministerial para más información o contacta a tu líder.",
          expression: 'worried',
        };
      }

      // Construir mensaje con los próximos turnos
      let mensaje = `👋 **Hola ${profile.full_name}!**\n\n`;
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

        // MEJORA: Usar formato de hora mejorado
        if (service.service_time) {
          mensaje += `⏰ Hora: ${this.formatServiceTime(service.service_time)}\n`;
        }

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
      console.error("Error consultando turnos:", error);
      return {
        type: "turnos",
        message:
          "🤖 Lo siento, hubo un error consultando los turnos. Por favor intenta nuevamente o consulta la agenda ministerial directamente.\n\n🔗 **[Ver Agenda Ministerial](/agenda)**",
        expression: 'worried',
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
        expression: 'happy',
      };
    } catch (error) {
      console.error("Error generando respuesta de ensayos:", error);
      return {
        type: "ensayos",
        message:
          "🤖 Lo siento, hubo un error consultando los ensayos. Los ensayos son todos los viernes de 07:00 p.m. a 09:00 p.m.",
        expression: 'worried',
      };
    }
  }

  private static async handleCancionesQuery(query: string, userId?: string): Promise<BotResponse> {
    try {
      console.log("ARCANA consultando canciones con query:", query);

      // Extraer términos de búsqueda
      const searchTerms = query.replace(/canción|cancion|canciones|buscar|repertorio|música|song/gi, "").trim();

      if (!searchTerms) {
        return {
          type: "canciones",
          message:
            '🤖 Lo siento, para buscar canciones, especifica el nombre o categoría. Ejemplo: "ARCANA buscar alabanza" o "ARCANA canción espíritu santo"',
          expression: 'worried',
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
          message: "🤖 Lo siento, hubo un error buscando canciones. Consulta directamente el repertorio musical.",
          expression: 'worried',
        };
      }

      console.log("Canciones encontradas:", canciones?.length || 0);

      if (!canciones || canciones.length === 0) {
        return {
          type: "canciones",
          message: `🤖 Lo siento, no encontré canciones con "${searchTerms}". Puedes buscar por título, artista, género o etiquetas en nuestro repertorio.\n\n🔗 Ver Repertorio Completo`,
          expression: 'worried',
        };
      }

      // Obtener próximo servicio donde el usuario es director/leader
      // Obtener info del usuario
      let profileName: string | null = null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      profileName = profile?.full_name || null;

      console.log("Usuario buscando servicios:", profileName, "ID:", userId);

      let nextService = null;

      // 1) Verificar grupos donde es líder
      const { data: userGroups } = await supabase
        .from("group_members")
        .select("group_id, is_leader")
        .eq("user_id", userId)
        .eq("is_active", true)
        .eq("is_leader", true);

      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      console.log("Grupos donde es líder:", userGroupIds);

      if (userGroupIds.length > 0) {
        const { data } = await supabase
          .from("services")
          .select("id, service_date, title")
          .in("assigned_group_id", userGroupIds)
          .gte("service_date", new Date().toISOString().split("T")[0])
          .order("service_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        nextService = data || null;
      }

      // 2) Si no encontró por grupos, buscar por nombre en campo leader
      if (!nextService && profileName) {
        console.log("Buscando servicios por nombre en leader:", profileName);
        const { data } = await supabase
          .from('services')
          .select('id, service_date, title, leader')
          .gte('service_date', new Date().toISOString().split('T')[0])
          .ilike('leader', `%${profileName}%`)
          .order('service_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        nextService = data || null;
        console.log("Servicio encontrado por leader:", nextService);
      }

      const serviceDate = nextService?.service_date;

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

        // Agregar enlaces clicables
        if (cancion.youtube_link) {
          mensaje += `🔗 [Ver en YouTube](${cancion.youtube_link})\n`;
        }
        if (cancion.spotify_link) {
          mensaje += `🔗 [Escuchar en Spotify](${cancion.spotify_link})\n`;
        }

        mensaje += "\n";
      });

      // Agregar información sobre botones solo si es director
      console.log("¿Es director?", { 
        userGroupIds: userGroupIds.length, 
        nextService: !!nextService,
        serviceDate,
        serviceId: nextService?.id 
      });
      
      if (nextService) {
        mensaje += `💡 **Haz clic en los botones para agregar al servicio del ${new Date(serviceDate!).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}**\n\n`;
      } else {
        mensaje += "💡 **Opciones disponibles:**\n";
        mensaje += "• 📖 Ver Repertorio Completo\n";
        mensaje += "• Solo los directores pueden agregar canciones a los servicios\n";
      }

      // Crear botones solo si tiene servicios asignados
      const actions: BotAction[] = nextService ? canciones.map((c: any) => ({
        type: 'select_song',
        songId: c.id,
        songName: c.title,
        serviceDate: nextService.service_date,
        serviceId: nextService.id
      })) : [];

      console.log("Acciones generadas:", actions.length, actions);

      return {
        type: "canciones",
        message: mensaje,
        expression: 'happy',
        actions
      };
    } catch (error) {
      console.error("Error buscando canciones:", error);
      return {
        type: "canciones",
        message: "🤖 Lo siento, hubo un error buscando canciones. Consulta directamente el repertorio musical.",
        expression: 'worried',
      };
    }
  }

  private static async handleGeneralQuery(query: string): Promise<BotResponse> {
    console.log("ARCANA manejando consulta general:", query);

    // Detectar consultas de cumpleaños
    if (query.includes("cumpleaños") || query.includes("cumpleanos")) {
      return await this.handleBirthdayQuery(query);
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
• "Cumpleaños de [mes]"

📖 **BIBLIA Y ESPIRITUAL**
• "Versículo del día"
• "Cita bíblica sobre [tema]"
• "Juan 3:16" (cualquier referencia bíblica)

💡 **EJEMPLOS PRÁCTICOS:**
• "ARCANA cuándo me toca cantar"
• "ARCANA buscar Como Lluvia"
• "ARCANA cuándo le toca a Armando Noel"
• "ARCANA próximo ensayo"
• "ARCANA cumpleaños de hoy"
• "ARCANA cumpleaños de noviembre"
• "ARCANA versículo del día"
• "ARCANA Juan 3:16"
• "ARCANA biblia sobre amor"

¡Estoy aquí para servirte! 🙏🎵`,
    };

    // Buscar coincidencias en las consultas
    for (const [key, response] of Object.entries(responses)) {
      if (query.includes(key)) {
        console.log("ARCANA encontró respuesta para:", key);
        return { type: "general", message: response, expression: 'happy' };
      }
    }

    // Respuesta por defecto
    console.log("ARCANA usando respuesta por defecto");
    return {
      type: "general",
      message:
        '🤖 Lo siento, no entendí tu consulta. Escribe "ARCANA ayuda" para ver todas las opciones disponibles.\n\n💡 Puedo ayudarte con:\n• Turnos de canto\n• Información de ensayos\n• Búsqueda de canciones\n• Selección de repertorio\n• Cumpleaños del ministerio\n• Versículos bíblicos\n• Referencias específicas de la Biblia',
      expression: 'worried',
    };
  }

  private static async handleBirthdayQuery(query: string): Promise<BotResponse> {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Mapeo de nombres de meses a números
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
            message: `🎂 **Cumpleaños de hoy (${currentDay}/${currentMonth}):**\n\n😊 No hay cumpleaños registrados para hoy.\n\n📅 Ver Módulo de Cumpleaños para consultar los próximos cumpleaños del ministerio.\n\n¡Celebremos juntos! 🙏✨`,
            expression: 'happy',
          };
        }

        let mensaje = `🎂 **¡Cumpleaños de hoy!** 🎉\n\n`;
        todayBirthdays.forEach((member) => {
          mensaje += `🎈 **${member.nombres} ${member.apellidos}**\n`;
        });
        mensaje += `\n💝 ¡No olvides felicitar a ${todayBirthdays.length > 1 ? "nuestros hermanos" : "nuestro hermano"}!\n\n📅 Ver más en Módulo de Cumpleaños`;

        return { type: "general", message: mensaje, expression: 'happy' };
      }

      // Buscar cumpleaños del mes específico
      let targetMonth = currentMonth;
      let specifiedMonth = "";

      // Buscar si se especificó un mes en la consulta
      for (const [monthName, monthNumber] of Object.entries(monthMap)) {
        if (query.includes(monthName)) {
          targetMonth = monthNumber;
          specifiedMonth = monthName;
          break;
        }
      }

      // Si se menciona "mes" sin especificar, usar el mes actual
      if (query.includes("mes") && !specifiedMonth) {
        targetMonth = currentMonth;
        specifiedMonth = Object.keys(monthMap).find((key) => monthMap[key] === currentMonth) || "";
      }

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
            return birthDate.getMonth() + 1 === targetMonth;
          })
          .sort((a, b) => {
            const dateA = new Date(a.fecha_nacimiento);
            const dateB = new Date(b.fecha_nacimiento);
            return dateA.getDate() - dateB.getDate();
          }) || [];

      if (monthBirthdays.length === 0) {
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
        return {
          type: "general",
          message: `🎂 **Cumpleaños de ${monthNames[targetMonth]}:**\n\n😊 No hay cumpleaños registrados para este mes.\n\n📅 Ver Módulo de Cumpleaños\n\n¡Celebremos juntos! 🙏✨`,
          expression: 'happy',
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
      let mensaje = `🎂 **Cumpleaños de ${monthNames[targetMonth]}:** 🎉\n\n`;

      monthBirthdays.forEach((member) => {
        const birthDate = new Date(member.fecha_nacimiento);
        const day = birthDate.getDate();
        mensaje += `📅 ${day} - **${member.nombres} ${member.apellidos}**\n`;
      });

      mensaje += `\n💝 Total: ${monthBirthdays.length} cumpleañero${monthBirthdays.length > 1 ? "s" : ""}\n\n📅 Ver más en Módulo de Cumpleaños\n\n¡No olvides felicitar a tus hermanos en Cristo! 🙏✨`;

      return { type: "general", message: mensaje, expression: 'happy' };
    } catch (error) {
      console.error("Error consultando cumpleaños:", error);
      return {
        type: "general",
        message: `🎂 **Cumpleaños:**\n\n🤖 Lo siento, hubo un error consultando los cumpleaños. Por favor visita el Módulo de Cumpleaños.\n\n¡Celebremos juntos! 🙏✨`,
        expression: 'worried',
      };
    }
  }

  static async sendBotResponse(roomId: string, response: BotResponse): Promise<void> {
    try {
      console.log("ARCANA enviando respuesta:", response.message.substring(0, 50) + "...");

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
        console.error("Error enviando respuesta del bot:", error);
        throw error;
      }

      console.log("ARCANA respuesta enviada exitosamente");
    } catch (error) {
      console.error("Error enviando respuesta del bot:", error);
    }
  }
}

// MEJORA: Hooks de React para UI
export const useUserTyping = () => {
  // Hook para manejar el estado de escritura del usuario
  // y mostrar foto mientras escribe
  const [isTyping, setIsTyping] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const startTyping = useCallback(async (userId: string) => {
    setIsTyping(true);
    // Obtener foto del usuario mientras escribe
    const photo = await ArcanaBot.getUserPhoto(userId);
    setUserPhoto(photo);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  return {
    isTyping,
    userPhoto,
    startTyping,
    stopTyping
  };
};

export const useVoiceMessages = () => {
  // Hook para manejar mensajes de voz
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);

  const processVoiceMessage = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const text = await ArcanaBot.processVoiceMessage(audioBlob);
      setTranscription(text);
      return text;
    } catch (error) {
      console.error("Error procesando mensaje de voz:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription(null);
  }, []);

  return {
    isProcessing,
    transcription,
    processVoiceMessage,
    clearTranscription
  };
};