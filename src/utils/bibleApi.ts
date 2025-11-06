/**
 * Utilidades mejoradas para integración con Bible API
 * SIN VERSÍCULOS DE FALLBACK
 */

interface BibleVerse {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
}

interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
}

const BIBLE_API_URL = "https://bible-api.com";
const DEFAULT_VERSION = "rvr1960";
const FALLBACK_VERSION = "rvr60";

/**
 * Obtiene un versículo aleatorio del día - SIN FALLBACK
 */
export const getRandomVerse = async (): Promise<BibleVerse | null> => {
  try {
    const popularVerses = [
      "Salmos 100:1-2",
      "Salmos 150:6",
      "Colosenses 3:16",
      "Efesios 5:19",
      "Salmos 95:1-2",
      "Salmos 96:1-2",
      "2 Samuel 22:4",
      "Salmos 34:1-3",
      "Hebreos 13:15",
      "Salmos 98:1",
      "Isaías 12:5",
      "Filipenses 4:4-7",
      "Salmos 103:1-2",
      "Salmos 136:1",
      "1 Crónicas 16:23-25",
      "Salmos 33:1-3",
    ];

    const randomIndex = Math.floor(Math.random() * popularVerses.length);
    const verse = popularVerses[randomIndex];

    console.log("🎲 [BibleAPI] Versículo aleatorio seleccionado:", verse);
    const result = await getSpecificVerse(verse);

    if (result) {
      return result;
    }

    // Si falla, intentar con otro
    const alternativeIndex = (randomIndex + 1) % popularVerses.length;
    const alternativeVerse = popularVerses[alternativeIndex];
    console.log("🔄 [BibleAPI] Intentando versículo alternativo:", alternativeVerse);
    return await getSpecificVerse(alternativeVerse);
  } catch (error) {
    console.error("❌ [BibleAPI] Error en versículo aleatorio:", error);
    return null; // NO HAY FALLBACK
  }
};

/**
 * Obtiene un versículo específico - SIN FALLBACK
 */
export const getSpecificVerse = async (reference: string): Promise<BibleVerse | null> => {
  try {
    const normalizedRef = normalizeReference(reference);
    console.log("🔍 [BibleAPI] Buscando:", reference, "-> Normalizado:", normalizedRef);

    let url = `${BIBLE_API_URL}/${encodeURIComponent(normalizedRef)}?translation=${DEFAULT_VERSION}`;
    console.log("🌐 [BibleAPI] URL principal:", url);

    let response = await fetchWithTimeout(url, 8000);

    if (!response.ok) {
      console.log("🔄 [BibleAPI] Intentando con versión alternativa...");
      url = `${BIBLE_API_URL}/${encodeURIComponent(normalizedRef)}?translation=${FALLBACK_VERSION}`;
      response = await fetchWithTimeout(url, 8000);
    }

    if (!response.ok) {
      console.error(`❌ [BibleAPI] Error HTTP: ${response.status}`);
      return null; // NO FALLBACK
    }

    const data: BibleApiResponse = await response.json();

    if (!data.text || data.text.trim().length === 0) {
      console.error("❌ [BibleAPI] Respuesta vacía");
      return null; // NO FALLBACK
    }

    console.log("✅ [BibleAPI] Versículo encontrado:", data.reference);

    return {
      reference: data.reference,
      text: cleanVerseText(data.text),
      translation_id: data.translation_id,
      translation_name: data.translation_name,
    };
  } catch (error) {
    console.error("❌ [BibleAPI] Error completo:", error);
    return null; // NO FALLBACK
  }
};

/**
 * Fetch con timeout
 */
const fetchWithTimeout = async (url: string, timeout: number = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Limpiar texto del versículo
 */
const cleanVerseText = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

/**
 * Normalización de referencias
 */
const normalizeReference = (reference: string): string => {
  const bookMap: { [key: string]: string } = {
    génesis: "genesis",
    éxodo: "exodus",
    levítico: "leviticus",
    números: "numbers",
    deuteronomio: "deuteronomy",
    josué: "joshua",
    jueces: "judges",
    rut: "ruth",
    "1 samuel": "1 samuel",
    "2 samuel": "2 samuel",
    "1 reyes": "1 kings",
    "2 reyes": "2 kings",
    "1 crónicas": "1 chronicles",
    "2 crónicas": "2 chronicles",
    esdras: "ezra",
    nehemías: "nehemiah",
    ester: "esther",
    job: "job",
    salmos: "psalms",
    salmo: "psalms",
    proverbios: "proverbs",
    eclesiastés: "ecclesiastes",
    cantares: "song of solomon",
    isaías: "isaiah",
    jeremías: "jeremiah",
    lamentaciones: "lamentations",
    ezequiel: "ezekiel",
    daniel: "daniel",
    oseas: "hosea",
    joel: "joel",
    amós: "amos",
    abdías: "obadiah",
    jonás: "jonah",
    miqueas: "micah",
    nahúm: "nahum",
    habacuc: "habakkuk",
    sofonías: "zephaniah",
    hageo: "haggai",
    zacarías: "zechariah",
    malaquías: "malachi",
    mateo: "matthew",
    marcos: "mark",
    lucas: "luke",
    juan: "john",
    hechos: "acts",
    romanos: "romans",
    "1 corintios": "1 corinthians",
    "2 corintios": "2 corinthians",
    gálatas: "galatians",
    efesios: "ephesians",
    filipenses: "philippians",
    colosenses: "colossians",
    "1 tesalonicenses": "1 thessalonians",
    "2 tesalonicenses": "2 thessalonians",
    "1 timoteo": "1 timothy",
    "2 timoteo": "2 timothy",
    tito: "titus",
    filemón: "philemon",
    hebreos: "hebrews",
    santiago: "james",
    "1 pedro": "1 peter",
    "2 pedro": "2 peter",
    "1 juan": "1 john",
    "2 juan": "2 john",
    "3 juan": "3 john",
    judas: "jude",
    apocalipsis: "revelation",
  };

  let normalized = reference.toLowerCase().trim();

  for (const [spanish, english] of Object.entries(bookMap)) {
    if (normalized.startsWith(spanish) || normalized.includes(` ${spanish}`)) {
      normalized = normalized.replace(spanish, english);
      break;
    }
  }

  return normalized;
};

/**
 * Buscar versículos por tema - SIN FALLBACK
 */
export const searchVersesByTopic = async (topic: string): Promise<BibleVerse[]> => {
  try {
    const topicVerses: { [key: string]: string[] } = {
      adoracion: ["Salmos 95:6", "Juan 4:23-24", "Salmos 100:1-2", "Hebreos 13:15", "Salmos 150:6"],
      alabanza: ["Salmos 150:6", "Salmos 100:4", "Hebreos 13:15", "Salmos 95:1-2", "Salmos 34:1"],
      amor: ["1 Corintios 13:4-8", "1 Juan 4:8", "Romanos 5:8", "Efesios 5:25", "Juan 13:34-35"],
      fe: ["Hebreos 11:1", "Romanos 10:17", "Santiago 2:17", "Marcos 11:22-24", "2 Corintios 5:7"],
      esperanza: ["Jeremías 29:11", "Romanos 15:13", "Salmos 42:11", "Isaías 40:31", "1 Pedro 1:3"],
      paz: ["Juan 14:27", "Filipenses 4:7", "Isaías 26:3", "Romanos 5:1", "Colosenses 3:15"],
      fortaleza: ["Filipenses 4:13", "Isaías 41:10", "Salmos 46:1", "2 Corintios 12:9", "Josué 1:9"],
      gracia: ["Efesios 2:8", "2 Corintios 12:9", "Tito 2:11", "Romanos 3:24", "Juan 1:16"],
      gozo: ["Nehemías 8:10", "Salmos 16:11", "Juan 15:11", "Filipenses 4:4", "Gálatas 5:22"],
      perdón: ["1 Juan 1:9", "Efesios 4:32", "Colosenses 3:13", "Mateo 6:14-15", "Lucas 6:37"],
      santidad: ["1 Pedro 1:15-16", "Hebreos 12:14", "Levítico 11:44", "2 Corintios 7:1", "1 Tesalonicenses 4:7"],
      servicio: ["Marcos 10:45", "Gálatas 5:13", "1 Pedro 4:10", "Romanos 12:1", "Filipenses 2:7"],
    };

    const normalizedTopic = topic
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const verses = topicVerses[normalizedTopic] || topicVerses["adoracion"];

    console.log(`🔍 [BibleAPI] Buscando ${verses.length} versículos sobre: ${topic}`);

    const results = await Promise.all(
      verses.map(async (ref, index) => {
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, 100));
        return await getSpecificVerse(ref);
      }),
    );

    const validResults = results.filter((v) => v !== null) as BibleVerse[];

    console.log(`✅ [BibleAPI] Encontrados ${validResults.length} versículos válidos sobre ${topic}`);
    return validResults.slice(0, 3);
  } catch (error) {
    console.error("❌ [BibleAPI] Error buscando versículos por tema:", error);
    return []; // ARRAY VACÍO, NO FALLBACK
  }
};
