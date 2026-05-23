import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface OutfitPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  storage_path: string;
  photo_date: string;
  service_id: string | null;
  notes: string | null;
  created_at: string;
}

export const MAX_OUTFIT_PHOTOS = 10;

// Compress an image to a reasonable mobile size (max 1080px, JPEG q=0.72)
async function compressImage(file: File, maxDim = 1080, quality = 0.72): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen"))), "image/jpeg", quality)
  );
}

export function useOutfitPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<OutfitPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("outfit_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("photo_date", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPhotos((data as OutfitPhoto[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const todayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const uploadPhoto = useCallback(
    async (file: File, opts?: { serviceId?: string | null; notes?: string | null }) => {
      if (!user) return null;
      const today = todayStr();
      // Verificar si ya hay foto hoy
      const existing = photos.find((p) => p.photo_date === today);
      if (existing) {
        toast({
          title: "Ya subiste una foto hoy",
          description: "Solo puedes guardar una foto por día.",
          variant: "destructive",
        });
        return null;
      }
      // Aviso si llegaremos al límite
      if (photos.length >= MAX_OUTFIT_PHOTOS) {
        toast({
          title: "Galería al máximo",
          description: "Se borrará automáticamente la foto más antigua para hacer espacio.",
        });
      }

      setUploading(true);
      try {
        const blob = await compressImage(file);
        const path = `${user.id}/${today}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("outfit-photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("outfit-photos").getPublicUrl(path);
        const { error: insErr, data: inserted } = await supabase
          .from("outfit_photos")
          .insert({
            user_id: user.id,
            photo_url: pub.publicUrl,
            storage_path: path,
            photo_date: today,
            service_id: opts?.serviceId ?? null,
            notes: opts?.notes ?? null,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        toast({ title: "Foto guardada", description: "Tu outfit se guardó correctamente." });
        await fetchPhotos();
        return inserted as OutfitPhoto;
      } catch (e: any) {
        toast({ title: "Error subiendo foto", description: e.message, variant: "destructive" });
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, photos, fetchPhotos]
  );

  const deletePhoto = useCallback(
    async (photo: OutfitPhoto) => {
      if (!user) return;
      try {
        await supabase.storage.from("outfit-photos").remove([photo.storage_path]);
        const { error } = await supabase.from("outfit_photos").delete().eq("id", photo.id);
        if (error) throw error;
        toast({ title: "Foto eliminada" });
        await fetchPhotos();
      } catch (e: any) {
        toast({ title: "Error eliminando", description: e.message, variant: "destructive" });
      }
    },
    [user, fetchPhotos]
  );

  const todayPhoto = photos.find((p) => p.photo_date === todayStr()) || null;

  return { photos, loading, uploading, uploadPhoto, deletePhoto, todayPhoto, refetch: fetchPhotos };
}
