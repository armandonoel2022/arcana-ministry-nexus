
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VerseHistoryData {
  id: string;
  date: string;
  reflection: string | null;
  bible_verses: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: string;
  };
}

export const VerseHistory = () => {
  const [verses, setVerses] = useState<VerseHistoryData[]>([]);
  const [filteredVerses, setFilteredVerses] = useState<VerseHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [versesPerPage] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerseHistory();
  }, []);

  useEffect(() => {
    filterVerses();
  }, [searchTerm, verses]);

  const fetchVerseHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_verses')
        .select(`
          *,
          bible_verses (
            book,
            chapter,
            verse,
            text,
            version
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      setVerses(data || []);
    } catch (error) {
      console.error('Error fetching verse history:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de versos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVerses = () => {
    if (!searchTerm) {
      setFilteredVerses(verses);
      return;
    }

    const filtered = verses.filter(verse => 
      verse.bible_verses.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verse.bible_verses.book.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (verse.reflection && verse.reflection.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredVerses(filtered);
    setCurrentPage(1);
  };

  // Paginación
  const indexOfLastVerse = currentPage * versesPerPage;
  const indexOfFirstVerse = indexOfLastVerse - versesPerPage;
  const currentVerses = filteredVerses.slice(indexOfFirstVerse, indexOfLastVerse);
  const totalPages = Math.ceil(filteredVerses.length / versesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-pulse" />
            <p className="text-gray-500">Cargando historial...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-arcana-blue-600" />
            Historial de Versos Diarios
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar en versos, libros o reflexiones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredVerses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron versos que coincidan con la búsqueda' : 'No hay versos en el historial'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentVerses.map((verse) => (
                  <Card key={verse.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-arcana-blue-600 border-arcana-blue-600">
                          {format(new Date(verse.date), "dd 'de' MMMM, yyyy", { locale: es })}
                        </Badge>
                        <Badge variant="secondary">
                          {verse.bible_verses.book} {verse.bible_verses.chapter}:{verse.bible_verses.verse}
                        </Badge>
                      </div>
                      
                      <blockquote className="text-gray-800 italic mb-3">
                        "{verse.bible_verses.text}"
                      </blockquote>
                      
                      {verse.reflection && (
                        <div className="bg-arcana-gold-50 p-3 rounded border-l-3 border-arcana-gold-500">
                          <p className="text-sm text-gray-700">{verse.reflection}</p>
                        </div>
                      )}
                      
                      <div className="text-right mt-2">
                        <span className="text-xs text-gray-500">
                          {verse.bible_verses.version}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
