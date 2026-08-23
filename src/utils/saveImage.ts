import { Capacitor } from '@capacitor/core';

/**
 * Guarda/comparte una imagen generada (canvas o dataURL).
 * - Web: descarga clásica con <a download>
 * - iOS/Android (Capacitor): escribe el archivo en caché y abre la hoja de
 *   compartir del sistema para "Guardar imagen" (los <a download> no funcionan
 *   dentro del WebView nativo).
 */
export async function saveImageDataUrl(
  dataUrl: string,
  filename: string,
  shareTitle = 'ARCANA',
): Promise<void> {
  const isNative = Capacitor.isNativePlatform?.() ?? false;

  if (!isNative) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    return;
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');

  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

  const written = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: shareTitle,
    text: shareTitle,
    url: written.uri,
    dialogTitle: 'Guardar o compartir imagen',
  });
}

export async function saveCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
  shareTitle = 'ARCANA',
): Promise<void> {
  return saveImageDataUrl(canvas.toDataURL('image/png'), filename, shareTitle);
}
