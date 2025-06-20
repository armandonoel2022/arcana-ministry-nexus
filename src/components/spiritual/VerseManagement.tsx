
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

interface DailyVerse {
  id: string;
  date: string;
  reflection: string | null;
  verse_id: string;
  bible_verses: BibleVerse;
}

export const VerseManagement = () => {
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
  const [dailyVerses, setDailyVerses] = useState<DailyVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedVerseId, setSelectedVerseId] = useState("");
  const [reflection, setReflection] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Obtener versos bíblicos
      const { data: verses, error: versesError } = await supabase
        .from('bible_verses')
        .select('*')
        .order('book');

      if (versesError) throw versesError;

      // Obtener versos diarios
      const { data: daily, error: dailyError } = await supabase
        .from('daily_verses')
        .select(`
          *,
          bible_verses (*)
        `)
        .order('date', { ascending: false });

      if (dailyError) throw dailyError;

      setBibleVerses(verses || []);
      setDailyVerses(daily || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDailyVerse = async () => {
    if (!selectedVerseId || !selectedDate) {
      toast({
        title: "Error",
        description: "Selecciona una fecha y un verso",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isEditMode && editingId) {
        // Actualizar verso existente
        const { error } = await supabase
          .from('daily_verses')
          .update({
            verse_id: selectedVerseId,
            date: selectedDate,
            reflection: reflection || null
          })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Verso diario actualizado correctamente"
        });
      } else {
        // Crear nuevo verso diario
        const { error } = await supabase
          .from('daily_verses')
          .insert({
            verse_id: selectedVerseId,
            date: selectedDate,
            reflection: reflection || null
          });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Verso diario creado correctamente"
        });
      }

      // Resetear formulario
      setSelectedVerseId("");
      setReflection("");
      setIsEditMode(false);
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving daily verse:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el verso diario",
        variant: "destructive"
      });
    }
  };

  const handleEditDailyVerse = (dailyVerse: DailyVerse) => {
    setSelectedDate(dailyVerse.date);
    setSelectedVerseId(dailyVerse.verse_id);
    setReflection(dailyVerse.reflection || "");
    setIsEditMode(true);
    setEditingId(dailyVerse.id);
  };

  const handleDeleteDailyVerse = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este verso diario?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('daily_verses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Verso diario eliminado correctamente"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting daily verse:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el verso diario",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setSelectedVerseId("");
    setReflection("");
    setIsEditMode(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-pulse" />
            <p className="text-gray-500">Cargando gestión de versos...</p>
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
            <Plus className="w-5 h-5 text-arcana-blue-600" />
            {isEditMode ? 'Editar Verso Diario' : 'Crear Verso Diario'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Verso Bíblico</label>
              <Select value={selectedVerseId} onValueChange={setSelectedVerseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un verso" />
                </SelectTrigger>
                <SelectContent>
                  {bibleVerses.map((verse) => (
                    <SelectItem key={verse.id} value={verse.id}>
                      {verse.book} {verse.chapter}:{verse.verse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reflexión (Opcional)</label>
            <Textarea
              placeholder="Escribe una reflexión sobre este verso..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveDailyVerse}>
              {isEditMode ? 'Actualizar' : 'Crear'} Verso Diario
            </Button>
            {isEditMode && (
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-arcana-blue-600" />
            Versos Diarios Existentes
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {dailyVerses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No hay versos diarios creados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyVerses.map((dailyVerse) => (
                <Card key={dailyVerse.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-arcana-blue-600 border-arcana-blue-600">
                        {format(new Date(dailyVerse.date), 'dd/MM/yyyy')}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDailyVerse(dailyVerse)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDailyVerse(dailyVerse.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <Badge variant="secondary">
                        {dailyVerse.bible_verses.book} {dailyVerse.bible_verses.chapter}:{dailyVerse.bible_verses.verse}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      "{dailyVerse.bible_verses.text}"
                    </p>
                    
                    {dailyVerse.reflection && (
                      <div className="bg-arcana-gold-50 p-2 rounded text-sm">
                        <strong>Reflexión:</strong> {dailyVerse.reflection}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
