import { Capacitor } from '@capacitor/core';

/**
 * Utilidades para guardar/compartir imágenes generadas (canvas o blob).
 *
 * Web: se usa `canvas.toBlob()` + `URL.createObjectURL()` + `revokeObjectURL`.
 * Los enlaces con `data:` URL no se descargan bien en Safari (iPhone/Mac),
 * por eso se evita `toDataURL()` en el navegador.
 *
 * iOS/Android (Capacitor): se escribe el archivo en caché y se abre la hoja de
 * compartir del sistema (los <a download> no funcionan dentro del WebView).
 */

const PNG_MIME = 'image/png';

/** Convierte un canvas en Blob. Lanza error claro si el lienzo está "tainted". */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = PNG_MIME,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo generar la imagen'));
        },
        type,
        quality,
      );
    } catch (err) {
      // Lienzo "tainted" (imagen remota sin permisos CORS)
      reject(err instanceof Error ? err : new Error('No se pudo generar la imagen'));
    }
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body = ''] = dataUrl.split(',');
  const mime = /:(.*?)[;,]/.exec(head)?.[1] || PNG_MIME;
  const isBase64 = head.includes('base64');
  const binary = isBase64 ? atob(body) : decodeURIComponent(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < buffer.length; i += chunkSize) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Descarga un blob en el navegador y libera la memoria al terminar. */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Libre solo después de que el navegador tome el archivo.
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

async function deliverBlob(blob: Blob, filename: string, shareTitle: string): Promise<void> {
  const isNative = Capacitor.isNativePlatform?.() ?? false;

  if (!isNative) {
    await downloadBlob(blob, filename);
    return;
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');

  const base64 = await blobToBase64(blob);
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

export async function saveImageDataUrl(
  dataUrl: string,
  filename: string,
  shareTitle = 'ARCANA',
): Promise<void> {
  await deliverBlob(dataUrlToBlob(dataUrl), filename, shareTitle);
}

export async function saveCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
  shareTitle = 'ARCANA',
): Promise<void> {
  const blob = await canvasToBlob(canvas);
  await deliverBlob(blob, filename, shareTitle);
}

/**
 * Comparte una imagen. En el navegador usa la hoja de compartir del sistema
 * cuando puede enviar archivos; si no, la descarga.
 */
export async function shareImageBlob(
  blob: Blob,
  filename: string,
  title = 'ARCANA',
  text?: string,
): Promise<'shared' | 'downloaded'> {
  const isNative = Capacitor.isNativePlatform?.() ?? false;
  if (isNative) {
    await deliverBlob(blob, filename, title);
    return 'shared';
  }

  const file = new File([blob], filename, { type: blob.type || PNG_MIME });
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }));

  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title, text });
      return 'shared';
    } catch (err) {
      // El usuario canceló: no intentamos la descarga.
      if ((err as Error)?.name === 'AbortError') return 'shared';
    }
  }

  await downloadBlob(blob, filename);
  return 'downloaded';
}
