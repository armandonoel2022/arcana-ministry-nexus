import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Music, CheckCircle, AlertCircle } from 'lucide-react';

interface HimnarioMigrationButtonProps {
  onMigrationComplete?: () => void;
}

const HIMNARIO_COVER_URL = 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/song-covers/265c7634-d54d-4c1a-aaa5-f536616bd9cf-0.7596374967615246.jpg';

const HimnarioMigrationButton: React.FC<HimnarioMigrationButtonProps> = ({ onMigrationComplete }) => {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<{ moved: number; coverFixed: number; errors: string[] } | null>(null);

  const handleMigrate = async () => {
    setMigrating(true);
    setResults(null);
    const errors: string[] = [];
    let moved = 0;
    let coverFixed = 0;

    try {
      // 1. Fetch songs starting with 2 digits + space that are still in "general"
      const { data: songsToMove, error: fetchError } = await supabase
        .from('songs')
        .select('id, title, category, cover_image_url')
        .eq('category', 'general')
        .like('title', '__ %');

      if (fetchError) throw fetchError;

      // Filter to only songs where title starts with exactly 2 digits
      const numberedSongs = songsToMove?.filter(s => /^\d{2} /.test(s.title)) || [];

      // 2. Move each song to himnario and set cover
      for (const song of numberedSongs) {
        const { error } = await supabase
          .from('songs')
          .update({
            category: 'himnario',
            cover_image_url: HIMNARIO_COVER_URL,
            updated_at: new Date().toISOString()
          })
          .eq('id', song.id);

        if (error) {
          errors.push(`${song.title}: ${error.message}`);
        } else {
          moved++;
        }
      }

      // 3. Fix songs already in himnario that are missing covers
      const { data: himnarioNoCover, error: himnarioError } = await supabase
        .from('songs')
        .select('id, title')
        .eq('category', 'himnario')
        .is('cover_image_url', null);

      if (himnarioError) {
        errors.push(`Error buscando himnarios sin carátula: ${himnarioError.message}`);
      } else if (himnarioNoCover && himnarioNoCover.length > 0) {
        for (const song of himnarioNoCover) {
          const { error } = await supabase
            .from('songs')
            .update({
              cover_image_url: HIMNARIO_COVER_URL,
              updated_at: new Date().toISOString()
            })
            .eq('id', song.id);

          if (error) {
            errors.push(`Carátula ${song.title}: ${error.message}`);
          } else {
            coverFixed++;
          }
        }
      }

      setResults({ moved, coverFixed, errors });

      if (moved > 0 || coverFixed > 0) {
        toast.success(`Migración completada: ${moved} movida(s), ${coverFixed} carátula(s) corregida(s)`);
        onMigrationComplete?.();
      } else if (errors.length === 0) {
        toast.info('No se encontraron canciones pendientes de migrar');
      }
    } catch (error: any) {
      toast.error('Error en la migración: ' + error.message);
      errors.push(error.message);
      setResults({ moved, coverFixed, errors });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Migrar Himnos Numerados</CardTitle>
            <p className="text-sm text-muted-foreground">
              Mueve canciones que inician con número (ej: "12 ROCA DE LA ETERNIDAD") al Himnario de Gloria
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Esta acción moverá todas las canciones del Repertorio General cuyo título comience con 2 dígitos 
            seguidos de un espacio hacia la categoría <strong>Himnario de Gloria</strong>, y les asignará 
            la carátula estándar del himnario.
          </p>
        </div>

        <Button
          onClick={handleMigrate}
          disabled={migrating}
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
        >
          {migrating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Migrando...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4 mr-2" />
              Ejecutar Migración
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-2">
            {results.moved > 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>{results.moved}</strong> canción(es) movida(s) al Himnario de Gloria
                </AlertDescription>
              </Alert>
            )}
            {results.coverFixed > 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>{results.coverFixed}</strong> carátula(s) corregida(s)
                </AlertDescription>
              </Alert>
            )}
            {results.moved === 0 && results.coverFixed === 0 && results.errors.length === 0 && (
              <Alert>
                <AlertDescription>No se encontraron canciones pendientes de migrar.</AlertDescription>
              </Alert>
            )}
            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  {results.errors.map((err, i) => <p key={i} className="text-sm">{err}</p>)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HimnarioMigrationButton;
