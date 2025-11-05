import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface MediaFile {
  id?: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  size: number;
}

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadMedia = useCallback(async (
    file: File, 
    roomId: string,
    userId: string
  ): Promise<MediaFile | null> => {
    try {
      setUploading(true);
      setProgress(0);

      // Validar tipo de archivo
      const fileType = file.type.split('/')[0] as 'image' | 'video' | 'audio';
      if (!['image', 'video', 'audio'].includes(fileType)) {
        throw new Error('Tipo de archivo no soportado');
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo no puede ser mayor a 10MB');
      }

      // Generar nombre único
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      // Subir a Supabase Storage en el bucket rehearsal-media (que ya existe)
      const { data, error } = await supabase.storage
        .from('rehearsal-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('rehearsal-media')
        .getPublicUrl(filePath);

      const mediaFile: MediaFile = {
        url: publicUrl,
        type: fileType,
        name: file.name,
        size: file.size,
      };

      setProgress(100);
      return mediaFile;

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const deleteMedia = useCallback(async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from('rehearsal-media')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      throw error;
    }
  }, []);

  return {
    uploading,
    progress,
    uploadMedia,
    deleteMedia,
  };
};
