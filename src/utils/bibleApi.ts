/**
 * Utilidades para integración con Bible API
 * API Externa: bible-api.com
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

const BIBLE_API_URL = 'https://bible-api.com';
const DEFAULT_VERSION = 'rvr60'; // Reina Valera 1960

/**
 * Obtiene un versículo aleatorio del día
 */
export const getRandomVerse = async (): Promise<BibleVerse | null> => {
  try {
    // Lista de versículos populares para el día
    const popularVerses = [
      'John 3:16',
      'Psalm 23:1',
      'Jeremiah 29:11',
      'Philippians 4:13',
      'Proverbs 3:5-6',
      'Romans 8:28',
      'Isaiah 41:10',
      'Matthew 6:33',
      'Psalm 46:1',
      'Joshua 1:9',
      '1 Corinthians 13:4-8',
      'Ephesians 2:8-9',
      'Psalm 37:4',
      'Matthew 11:28',
      'Romans 12:2'
    ];

    const randomIndex = Math.floor(Math.random() * popularVerses.length);
    const verse = popularVerses[randomIndex];
    
    return await getSpecificVerse(verse);
  } catch (error) {
    console.error('Error getting random verse:', error);
    return getFallbackVerse();
  }
};

/**
 * Obtiene un versículo específico por referencia
 * @param reference Referencia bíblica (ej: "John 3:16", "Salmos 23:1")
 */
export const getSpecificVerse = async (reference: string): Promise<BibleVerse | null> => {
  try {
    // Normalizar referencia para español
    const normalizedRef = normalizeReference(reference);
    console.log('Buscando versículo:', reference, '-> Normalizado:', normalizedRef);
    
    const url = `${BIBLE_API_URL}/${encodeURIComponent(normalizedRef)}?translation=${DEFAULT_VERSION}`;
    console.log('URL de API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Bible API error: ${response.status} ${response.statusText}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data: BibleApiResponse = await response.json();
    console.log('Respuesta de API recibida:', data.reference);
    
    return {
      reference: data.reference,
      text: data.text.trim(),
      translation_id: data.translation_id,
      translation_name: data.translation_name
    };
  } catch (error) {
    console.error('Error fetching specific verse:', error, 'para referencia:', reference);
    return getFallbackVerse();
  }
};

/**
 * Busca versículos por tema
 * @param topic Tema a buscar (amor, fe, esperanza, etc.)
 */
export const searchVersesByTopic = async (topic: string): Promise<BibleVerse[]> => {
  try {
    // Mapeo de temas a versículos relevantes
    const topicVerses: { [key: string]: string[] } = {
      'amor': ['1 Corinthians 13:4-8', 'John 3:16', '1 John 4:8'],
      'fe': ['Hebrews 11:1', 'Romans 10:17', 'James 2:17'],
      'esperanza': ['Jeremiah 29:11', 'Romans 15:13', 'Psalm 42:11'],
      'paz': ['John 14:27', 'Philippians 4:7', 'Isaiah 26:3'],
      'fortaleza': ['Philippians 4:13', 'Isaiah 41:10', 'Psalm 46:1'],
      'salvación': ['Acts 4:12', 'Romans 10:9', 'Ephesians 2:8-9'],
      'gracia': ['Ephesians 2:8', '2 Corinthians 12:9', 'Titus 2:11'],
      'alabanza': ['Psalm 150:6', 'Psalm 100:4', 'Hebrews 13:15'],
      'gozo': ['Nehemiah 8:10', 'Psalm 16:11', 'John 15:11'],
      'perdón': ['1 John 1:9', 'Ephesians 4:32', 'Colossians 3:13']
    };

    const normalizedTopic = topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const verses = topicVerses[normalizedTopic] || topicVerses['amor']; // Default a amor

    const results = await Promise.all(
      verses.map(ref => getSpecificVerse(ref))
    );

    return results.filter(v => v !== null) as BibleVerse[];
  } catch (error) {
    console.error('Error searching verses by topic:', error);
    return [getFallbackVerse()].filter(v => v !== null) as BibleVerse[];
  }
};

/**
 * Normaliza referencias bíblicas de español a inglés para la API
 */
const normalizeReference = (reference: string): string => {
  const bookMap: { [key: string]: string } = {
    'juan': 'john',
    'salmos': 'psalm',
    'salmo': 'psalm',
    'jeremías': 'jeremiah',
    'filipenses': 'philippians',
    'proverbios': 'proverbs',
    'romanos': 'romans',
    'isaías': 'isaiah',
    'mateo': 'matthew',
    'josué': 'joshua',
    'corintios': 'corinthians',
    'efesios': 'ephesians',
    'hebreos': 'hebrews',
    'santiago': 'james',
    'hechos': 'acts',
    'tito': 'titus',
    'nehemías': 'nehemiah',
    'colosenses': 'colossians'
  };

  let normalized = reference.toLowerCase();
  
  for (const [spanish, english] of Object.entries(bookMap)) {
    if (normalized.includes(spanish)) {
      normalized = normalized.replace(spanish, english);
      break;
    }
  }

  return normalized;
};

/**
 * Versículo de respaldo cuando la API falla
 */
const getFallbackVerse = (): BibleVerse => {
  return {
    reference: 'Juan 3:16',
    text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
    translation_id: 'rvr60',
    translation_name: 'Reina Valera 1960'
  };
};
