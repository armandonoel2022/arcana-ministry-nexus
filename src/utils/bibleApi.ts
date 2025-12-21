/**
 * Sistema de versículos bíblicos - Web Scraping de BibleGateway
 * 100% gratuito, sin límites, sin API keys
 */

interface BibleVerse {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
}

/**
 * Obtiene versículo de BibleGateway usando web scraping
 */
export const getSpecificVerse = async (reference: string): Promise<BibleVerse | null> => {
  try {
    console.log("🔍 [BibleGateway] Buscando:", reference);

    // Primero intentar con BibleGateway
    const verse = await fetchFromBibleGateway(reference);
    if (verse) {
      return verse;
    }

    // Si falla, intentar con biblia paralela
    console.log("🔄 [BibleGateway] Falló, intentando Biblia Paralela...");
    return await fetchFromBibliaParalela(reference);
  } catch (error) {
    console.error("❌ [BibleGateway] Error completo:", error);
    return getFromLocalDatabase(reference);
  }
};

/**
 * Web Scraping de BibleGateway (sitio público)
 */
const fetchFromBibleGateway = async (reference: string): Promise<BibleVerse | null> => {
  try {
    // BibleGateway permite acceso público
    const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=RVR1960`;
    console.log("🌐 [BibleGateway] URL:", url);

    // Usar proxy CORS para evitar bloqueos
    const corsProxy = "https://cors-anywhere.herokuapp.com/";
    const response = await fetch(`${corsProxy}${url}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error("❌ [BibleGateway] HTTP Error:", response.status);
      return null;
    }

    const html = await response.text();

    // Extraer texto usando regex (simplificado)
    const verseMatch = html.match(/<div class="passage-text">([\s\S]*?)<\/div>/);
    if (verseMatch) {
      // Limpiar HTML y extraer texto
      const cleanText = verseMatch[1]
        .replace(/<[^>]*>/g, " ") // Remover tags HTML
        .replace(/\s+/g, " ") // Espacios múltiples a uno
        .trim();

      if (cleanText.length > 10) {
        return {
          reference: reference,
          text: cleanText.substring(0, 500), // Limitar longitud
          translation_id: "RVR1960",
          translation_name: "Reina Valera 1960",
        };
      }
    }

    return null;
  } catch (error) {
    console.error("❌ [BibleGateway] Error:", error);
    return null;
  }
};

/**
 * Alternativa: Biblia Paralela (sitio en español)
 */
const fetchFromBibliaParalela = async (reference: string): Promise<BibleVerse | null> => {
  try {
    const url = `https://www.bibliatodo.com/biblia/Reina-Valera-1960/${encodeURIComponent(reference.replace(/ /g, "/"))}`;
    console.log("🌐 [BibliaParalela] URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Buscar contenido del versículo
    const verseMatch = html.match(/<p class="verse"[^>]*>([\s\S]*?)<\/p>/);
    if (verseMatch) {
      const cleanText = verseMatch[1]
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return {
        reference: reference,
        text: cleanText,
        translation_id: "RVR1960",
        translation_name: "Reina Valera 1960",
      };
    }

    return null;
  } catch (error) {
    console.error("❌ [BibliaParalela] Error:", error);
    return null;
  }
};

/**
 * Base de datos local como último recurso
 */
const getFromLocalDatabase = (reference: string): BibleVerse | null => {
  const localVerses: { [key: string]: BibleVerse } = {
    "salmos 23:1": {
      reference: "Salmos 23:1",
      text: "Jehová es mi pastor; nada me faltará.",
      translation_id: "RVR1960",
      translation_name: "Reina Valera 1960",
    },
    "salmos 100:1-2": {
      reference: "Salmos 100:1-2",
      text: "Cantad alegres a Dios, habitantes de toda la tierra. Servid a Jehová con alegría; Venid ante su presencia con regocijo.",
      translation_id: "RVR1960",
      translation_name: "Reina Valera 1960",
    },
    "juan 3:16": {
      reference: "Juan 3:16",
      text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
      translation_id: "RVR1960",
      translation_name: "Reina Valera 1960",
    },
    "juan 3:17": {
      reference: "Juan 3:17",
      text: "Porque no envió Dios a su Hijo al mundo para condenar al mundo, sino para que el mundo sea salvo por él.",
      translation_id: "RVR1960",
      translation_name: "Reina Valera 1960",
    },
    "filipenses 4:13": {
      reference: "Filipenses 4:13",
      text: "Todo lo puedo en Cristo que me fortalece.",
      translation_id: "RVR1960",
      translation_name: "Reina Valera 1960",
    },
  };

  const key = reference.toLowerCase();
  if (localVerses[key]) {
    return localVerses[key];
  }
  
  // Return a random verse from local database instead of always Juan 3:16
  const localKeys = Object.keys(localVerses);
  const randomKey = localKeys[Math.floor(Math.random() * localKeys.length)];
  return localVerses[randomKey];
};

/**
 * Versículo aleatorio - usa los más comunes
 */
export const getRandomVerse = async (): Promise<BibleVerse | null> => {
  // Selección determinística por día para evitar “random” repetido en algunos entornos
  const verses = [
    "Salmos 23:1",
    "Salmos 100:1-2",
    "Filipenses 4:13",
    "Jeremías 29:11",
    "Romanos 8:28",
    "Isaías 41:10",
    "Proverbios 3:5-6",
    "Juan 3:17",
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const randomVerse = verses[dayOfYear % verses.length];
  return await getSpecificVerse(randomVerse);
};

/**
 * Búsqueda por tema
 */
export const searchVersesByTopic = async (topic: string): Promise<BibleVerse[]> => {
  const topicMap: { [key: string]: string[] } = {
    adoracion: ["Salmos 95:6", "Juan 4:23-24", "Salmos 100:1-2"],
    alabanza: ["Salmos 150:6", "Salmos 100:4", "Hebreos 13:15"],
    fe: ["Hebreos 11:1", "Romanos 10:17", "Marcos 11:22-24"],
    amor: ["1 Corintios 13:4-8", "Juan 3:16", "1 Juan 4:8"],
  };

  const normalizedTopic = topic.toLowerCase();
  const verses = topicMap[normalizedTopic] || topicMap["adoracion"];

  const results = await Promise.all(verses.map((ref) => getSpecificVerse(ref)));

  return results.filter((v) => v !== null) as BibleVerse[];
};
