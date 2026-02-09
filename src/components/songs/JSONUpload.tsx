import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Download, Loader2, AlertCircle, CheckCircle, FileJson, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JSONUploadProps {
  onUploadComplete?: () => void;
  defaultCategory?: string;
}

interface SongJSON {
  title: string;
  artist?: string;
  genre?: string;
  difficulty_level?: number;
  tempo?: string;
  key_signature?: string;
  lyrics?: string;
  chords?: string;
  youtube_link?: string;
  spotify_link?: string;
  tags?: string[];
  category?: string;
  cover_image_url?: string;
}

const JSONUpload: React.FC<JSONUploadProps> = ({ onUploadComplete, defaultCategory }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: Array<{ index: number; title: string; error: string }>;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (songs: SongJSON[]) => {
      const results = {
        success: 0,
        errors: [] as Array<{ index: number; title: string; error: string }>
      };

      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        try {
          if (!song.title || song.title.trim() === '') {
            results.errors.push({
              index: i + 1,
              title: 'Sin título',
              error: 'El título es obligatorio'
            });
            continue;
          }

          const songData = {
            title: song.title.trim(),
            artist: song.artist?.trim() || null,
            genre: song.genre?.trim() || null,
            difficulty_level: song.difficulty_level || 1,
            tempo: song.tempo?.trim() || null,
            key_signature: song.key_signature?.trim() || null,
            lyrics: song.lyrics?.trim() || null,
            chords: song.chords?.trim() || null,
            youtube_link: song.youtube_link?.trim() || null,
            spotify_link: song.spotify_link?.trim() || null,
            tags: song.tags || [],
            category: song.category || defaultCategory || 'general',
            cover_image_url: song.cover_image_url?.trim() || null,
            is_active: true,
          };

          const { error } = await supabase
            .from('songs')
            .insert([songData]);

          if (error) {
            results.errors.push({
              index: i + 1,
              title: song.title,
              error: error.message
            });
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push({
            index: i + 1,
            title: song.title || 'Desconocido',
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setUploadResults(results);
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      
      if (results.success > 0) {
        toast({
          title: 'Carga completada',
          description: `${results.success} canción(es) importada(s) exitosamente`,
        });
      }
      
      if (results.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Algunos errores ocurrieron',
          description: `${results.errors.length} canción(es) con errores`,
        });
      }

      if (onUploadComplete) onUploadComplete();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error en la carga',
        description: error.message,
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json'))) {
      setFile(selectedFile);
      setUploadResults(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Archivo inválido',
        description: 'Por favor selecciona un archivo JSON válido',
      });
    }
  };

  const parseAndUpload = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const songs: SongJSON[] = Array.isArray(parsed) ? parsed : [parsed];
      
      if (songs.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Sin datos',
          description: 'El JSON no contiene canciones',
        });
        return;
      }

      mutation.mutate(songs);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'JSON inválido',
        description: 'El formato del JSON no es válido. Verifica la estructura.',
      });
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && file) {
      const text = await file.text();
      await parseAndUpload(text);
    } else if (uploadMode === 'paste' && jsonText.trim()) {
      await parseAndUpload(jsonText);
    }
  };

  const templateJSON: SongJSON[] = [
    {
      title: "01 EJEMPLO DE HIMNO",
      artist: "Autor del Himno",
      genre: "Himno",
      difficulty_level: 2,
      tempo: "Moderado",
      key_signature: "G",
      lyrics: "Primera estrofa del himno...\n\nSegunda estrofa del himno...\n\nCoro:\nEl coro del himno...",
      chords: "G D Em C",
      category: "himnario",
      tags: ["himno", "clasico"]
    },
    {
      title: "02 SEGUNDO EJEMPLO",
      artist: "Otro Autor",
      genre: "Alabanza",
      difficulty_level: 3,
      key_signature: "C",
      lyrics: "Letra de la canción...",
      category: "himnario"
    }
  ];

  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(templateJSON, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_canciones.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(templateJSON, null, 2));
    toast({
      title: 'Copiado',
      description: 'Plantilla JSON copiada al portapapeles',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Carga Masiva JSON</CardTitle>
              <p className="text-sm text-muted-foreground">Importa múltiples canciones desde un archivo JSON</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="font-medium mb-2">Plantilla JSON</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Descarga o copia la plantilla para asegurar el formato correcto.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla
              </Button>
              <Button variant="outline" size="sm" onClick={copyTemplate}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Plantilla
              </Button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={uploadMode === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMode('file')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Archivo
            </Button>
            <Button
              variant={uploadMode === 'paste' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMode('paste')}
            >
              <Copy className="w-4 h-4 mr-2" />
              Pegar JSON
            </Button>
          </div>

          {/* Upload Area */}
          {uploadMode === 'file' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="json-file" className="block text-sm font-medium mb-2">
                  Seleccionar archivo JSON
                </label>
                <Input
                  id="json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileJson className="w-4 h-4" />
                  <span>{file.name}</span>
                  <span>({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Pegar JSON
              </label>
              <Textarea
                placeholder={`[\n  {\n    "title": "01 NOMBRE DEL HIMNO",\n    "category": "himnario",\n    "lyrics": "Letra aquí..."\n  }\n]`}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={
              mutation.isPending || 
              (uploadMode === 'file' && !file) || 
              (uploadMode === 'paste' && !jsonText.trim())
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Canciones
              </>
            )}
          </Button>

          {/* Format Reference */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Campos disponibles</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>title</strong>: Nombre de la canción (obligatorio)</li>
              <li>• <strong>category</strong>: "general", "himnario", "villancicos", "adn"</li>
              <li>• <strong>artist</strong>: Artista o compositor</li>
              <li>• <strong>genre</strong>: Género musical</li>
              <li>• <strong>lyrics</strong>: Letra completa de la canción</li>
              <li>• <strong>chords</strong>: Acordes o cifrado</li>
              <li>• <strong>key_signature</strong>: Tonalidad (Ej: G, Am)</li>
              <li>• <strong>tempo</strong>: Velocidad</li>
              <li>• <strong>difficulty_level</strong>: 1-5</li>
              <li>• <strong>youtube_link</strong>: URL de YouTube</li>
              <li>• <strong>spotify_link</strong>: URL de Spotify</li>
              <li>• <strong>cover_image_url</strong>: URL de la carátula</li>
              <li>• <strong>tags</strong>: Array de etiquetas ["himno", "clasico"]</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {uploadResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResults.success > 0 && uploadResults.errors.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              Resultados de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadResults.success > 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>{uploadResults.success}</strong> canción(es) importada(s) exitosamente
                </AlertDescription>
              </Alert>
            )}

            {uploadResults.errors.length > 0 && (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>{uploadResults.errors.length}</strong> canción(es) con errores:
                  </AlertDescription>
                </Alert>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {uploadResults.errors.map((error, index) => (
                    <div key={index} className="bg-destructive/10 p-3 rounded border border-destructive/20">
                      <p className="text-sm font-medium">
                        #{error.index} - {error.title}: {error.error}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JSONUpload;
