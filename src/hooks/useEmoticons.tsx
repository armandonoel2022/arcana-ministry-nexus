import { useMemo } from 'react';

export interface Emoticon {
  code: string;
  emoji: string;
  description: string;
  category: string;
}

export const useEmoticons = () => {
  const emoticonLibrary = useMemo(() => [
    // Emoticones básicos
    { code: ':)', emoji: '😊', description: 'Sonrisa', category: 'caritas' },
    { code: ':(', emoji: '😔', description: 'Triste', category: 'caritas' },
    { code: ':D', emoji: '😃', description: 'Feliz', category: 'caritas' },
    { code: ';)', emoji: '😉', description: 'Guiño', category: 'caritas' },
    { code: ':O', emoji: '😲', description: 'Sorprendido', category: 'caritas' },
    { code: ':P', emoji: '😛', description: 'Lengua', category: 'caritas' },
    { code: ':/', emoji: '😕', description: 'Indeciso', category: 'caritas' },
    
    // Ministerio y música
    { code: ':worship:', emoji: '🙏', description: 'Adoración', category: 'ministerio' },
    { code: ':music:', emoji: '🎵', description: 'Música', category: 'ministerio' },
    { code: ':microphone:', emoji: '🎤', description: 'Microfono', category: 'ministerio' },
    { code: ':guitar:', emoji: '🎸', description: 'Guitarra', category: 'ministerio' },
    { code: ':piano:', emoji: '🎹', description: 'Piano', category: 'ministerio' },
    { code: ':church:', emoji: '⛪', description: 'Iglesia', category: 'ministerio' },
    { code: ':bible:', emoji: '📖', description: 'Biblia', category: 'ministerio' },
    { code: ':pray:', emoji: '🙌', description: 'Alabanza', category: 'ministerio' },
    
    // Acciones y objetos
    { code: ':like:', emoji: '👍', description: 'Me gusta', category: 'acciones' },
    { code: ':heart:', emoji: '❤️', description: 'Corazón', category: 'acciones' },
    { code: ':fire:', emoji: '🔥', description: 'Fuego', category: 'acciones' },
    { code: ':star:', emoji: '⭐', description: 'Estrella', category: 'acciones' },
    { code: ':clap:', emoji: '👏', description: 'Aplausos', category: 'acciones' },
    { code: ':rocket:', emoji: '🚀', description: 'Cohete', category: 'acciones' },
    
    // ARCANA específicos
    { code: ':arcana:', emoji: '🤖', description: 'ARCANA', category: 'arcana' },
    { code: ':turno:', emoji: '📅', description: 'Turno', category: 'arcana' },
    { code: ':ensayo:', emoji: '🎵', description: 'Ensayo', category: 'arcana' },
    { code: ':cumple:', emoji: '🎂', description: 'Cumpleaños', category: 'arcana' },
  ], []);

  const replaceEmoticons = (text: string): string => {
    let processedText = text;
    emoticonLibrary.forEach(emoticon => {
      const regex = new RegExp(emoticon.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedText = processedText.replace(regex, emoticon.emoji);
    });
    return processedText;
  };

  const getEmoticonsByCategory = (category: string): Emoticon[] => {
    return emoticonLibrary.filter(emoticon => emoticon.category === category);
  };

  const searchEmoticons = (query: string): Emoticon[] => {
    return emoticonLibrary.filter(emoticon => 
      emoticon.description.toLowerCase().includes(query.toLowerCase()) ||
      emoticon.code.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    emoticonLibrary,
    replaceEmoticons,
    getEmoticonsByCategory,
    searchEmoticons,
  };
};
