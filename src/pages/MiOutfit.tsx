import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shirt, Camera, Trash2, Calendar as CalendarIcon, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { useOutfitPhotos, MAX_OUTFIT_PHOTOS, OutfitPhoto } from "@/hooks/useOutfitPhotos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatDate = (s: string) => {
  // Parse YYYY-MM-DD at local noon to avoid TZ shifts
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return dt.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const MiOutfit: React.FC = () => {
  const { photos, loading, uploading, uploadPhoto, deletePhoto, todayPhoto } = useOutfitPhotos();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<OutfitPhoto | null>(null);
  const [toDelete, setToDelete] = useState<OutfitPhoto | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await uploadPhoto(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  const slotsLeft = MAX_OUTFIT_PHOTOS - photos.length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-4 max-w-none sm:max-w-7xl sm:mx-auto sm:px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <Shirt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">Mi Outfit</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Guarda tu outfit del día para evitar repetirlo en el siguiente servicio
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-100 to-pink-100 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-violet-700" />
              <div>
                <CardTitle className="text-violet-900 text-base sm:text-lg">Subir outfit de hoy</CardTitle>
                <CardDescription className="text-violet-700 text-xs sm:text-sm">
                  Una foto por día • Calidad optimizada para móvil
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !!todayPhoto}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white flex-1"
                size="lg"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo...</>
                ) : todayPhoto ? (
                  <><AlertCircle className="w-4 h-4 mr-2" />Ya subiste foto hoy</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" />Tomar / Elegir foto</>
                )}
              </Button>
              <div className="text-xs sm:text-sm text-gray-600 flex items-center justify-center sm:justify-end gap-2 px-2">
                <ImageIcon className="w-4 h-4" />
                <span>
                  <strong>{photos.length}</strong> / {MAX_OUTFIT_PHOTOS} fotos
                  {slotsLeft <= 2 && slotsLeft > 0 && (
                    <span className="ml-2 text-amber-600">({slotsLeft} disponibles)</span>
                  )}
                  {slotsLeft <= 0 && (
                    <span className="ml-2 text-red-600">Se borrará la más antigua</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-gray-700" />
              <div>
                <CardTitle className="text-gray-900 text-base sm:text-lg">Mi Galería</CardTitle>
                <CardDescription className="text-gray-600 text-xs sm:text-sm">
                  Tus últimos {MAX_OUTFIT_PHOTOS} outfits guardados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="py-12 flex items-center justify-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Cargando galería...
              </div>
            ) : photos.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Shirt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Aún no tienes outfits guardados</p>
                <p className="text-sm mt-1">Sube tu primera foto para empezar tu historial</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <img
                      src={p.photo_url}
                      alt={`Outfit ${p.photo_date}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-left">
                      <div className="flex items-center gap-1 text-white text-xs font-medium">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(p.photo_date + "T12:00:00").toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {selected && (
            <>
              <div className="bg-black flex items-center justify-center max-h-[70vh]">
                <img
                  src={selected.photo_url}
                  alt={`Outfit ${selected.photo_date}`}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
              <div className="p-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <CalendarIcon className="w-4 h-4 text-violet-600" />
                    <span className="break-words capitalize">{formatDate(selected.photo_date)}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Guardado el {new Date(selected.created_at).toLocaleString("es-ES")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setToDelete(selected);
                      setSelected(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La foto se borrará de tu galería permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (toDelete) await deletePhoto(toDelete);
                setToDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MiOutfit;
