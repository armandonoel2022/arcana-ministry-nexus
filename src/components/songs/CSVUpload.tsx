
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CSVUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: Array<{ row: number; error: string; data: any }>;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      const results = {
        success: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>
      };

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Validar campos requeridos
          if (!row.title || row.title.trim() === '') {
            results.errors.push({
              row: i + 2, // +2 porque empezamos en fila 1 y saltamos el header
              error: 'El título es obligatorio',
              data: row
            });
            continue;
          }

          // Preparar datos para insertar
          const songData = {
            title: row.title.trim(),
            artist: row.artist?.trim() || null,
            genre: row.genre?.trim() || null,
            difficulty_level: parseInt(row.difficulty_level) || 1,
            tempo: row.tempo?.trim() || null,
            key_signature: row.key_signature?.trim() || null,
            lyrics: row.lyrics?.trim() || null,
            chords: row.chords?.trim() || null,
            youtube_link: row.youtube_link?.trim() || null,
            spotify_link: row.spotify_link?.trim() || null,
            tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
            is_active: true,
          };

          // Validar URLs si están presentes
          if (songData.youtube_link && !isValidUrl(songData.youtube_link)) {
            results.errors.push({
              row: i + 2,
              error: 'URL de YouTube inválida',
              data: row
            });
            continue;
          }

          if (songData.spotify_link && !isValidUrl(songData.spotify_link)) {
            results.errors.push({
              row: i + 2,
              error: 'URL de Spotify inválida',
              data: row
            });
            continue;
          }

          // Insertar en la base de datos
          const { error } = await supabase
            .from('songs')
            .insert([songData]);

          if (error) {
            results.errors.push({
              row: i + 2,
              error: error.message,
              data: row
            });
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Error desconocido',
            data: row
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
          description: `${results.success} canción(es) agregada(s) exitosamente`,
        });
      }
      
      if (results.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Algunos errores ocurrieron',
          description: `${results.errors.length} fila(s) tuvieron errores`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error en la carga',
        description: error.message,
      });
    },
  });

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadResults(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Archivo inválido',
        description: 'Por favor selecciona un archivo CSV válido',
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
      toast({
        variant: 'destructive',
        title: 'Archivo vacío',
        description: 'El archivo CSV debe contener al menos una fila de datos',
      });
      return;
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    mutation.mutate(data);
  };

  const downloadTemplate = () => {
    const template = `title,artist,genre,difficulty_level,tempo,key_signature,lyrics,chords,youtube_link,spotify_link,tags
"Amazing Grace","John Newton","Himno",2,"Lento","G","Amazing grace how sweet the sound...","G D Em C","","","clasico,himno,adoracion"
"Ejemplo Canción","Artista Ejemplo","Alabanza",3,"Moderado","C","Letra de ejemplo...","C G Am F","https://youtube.com/watch?v=example","","alabanza,ejemplo"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_canciones.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Carga Masiva de Canciones</CardTitle>
              <p className="text-sm text-gray-600">Importa múltiples canciones desde un archivo CSV</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Plantilla CSV</h3>
            <p className="text-sm text-blue-700 mb-3">
              Descarga la plantilla para asegurar el formato correcto de tu archivo CSV.
            </p>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo CSV
              </label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || mutation.isPending}
              className="bg-arcana-gradient hover:opacity-90"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Canciones
                </>
              )}
            </Button>
          </div>

          {/* Format Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Formato del archivo</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>title</strong>: Nombre de la canción (obligatorio)</li>
              <li>• <strong>artist</strong>: Artista o compositor</li>
              <li>• <strong>genre</strong>: Género musical</li>
              <li>• <strong>difficulty_level</strong>: Nivel de dificultad (1-5)</li>
              <li>• <strong>tempo</strong>: Tempo o velocidad</li>
              <li>• <strong>key_signature</strong>: Tono musical</li>
              <li>• <strong>lyrics</strong>: Letra de la canción</li>
              <li>• <strong>chords</strong>: Acordes o cifrado</li>
              <li>• <strong>youtube_link</strong>: Enlace de YouTube</li>
              <li>• <strong>spotify_link</strong>: Enlace de Spotify</li>
              <li>• <strong>tags</strong>: Etiquetas separadas por comas</li>
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
              Resultados de la Carga
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadResults.success > 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>{uploadResults.success}</strong> canción(es) agregada(s) exitosamente
                </AlertDescription>
              </Alert>
            )}

            {uploadResults.errors.length > 0 && (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>{uploadResults.errors.length}</strong> fila(s) tuvieron errores:
                  </AlertDescription>
                </Alert>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {uploadResults.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-800">
                        Fila {error.row}: {error.error}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Título: {error.data.title || 'Sin título'}
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

export default CSVUpload;
