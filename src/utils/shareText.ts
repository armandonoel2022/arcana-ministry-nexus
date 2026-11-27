/**
 * Compartir texto en la versión web.
 *
 * - Si el navegador ofrece la hoja de compartir (móvil, y algunos escritorios),
 *   se usa `navigator.share`.
 * - Si no existe o falla (p. ej. Safari de escritorio no tiene `navigator.share`),
 *   se copia al portapapeles con un respaldo para navegadores antiguos.
 * - Nunca deja una promesa rechazada sin avisar al usuario.
 */

export type ShareTextResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function copyTextRobust(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // seguimos con el respaldo
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export async function shareOrCopyText({
  title,
  text,
}: {
  title: string;
  text: string;
}): Promise<ShareTextResult> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  if (nav && typeof nav.share === 'function') {
    const payload = { title, text };
    const canShare = typeof nav.canShare === 'function' ? nav.canShare(payload) : true;
    if (canShare) {
      try {
        await nav.share(payload);
        return 'shared';
      } catch (err) {
        const name = (err as Error)?.name;
        if (name === 'AbortError') return 'cancelled';
        // NotAllowedError / NotSupportedError: probamos el portapapeles.
      }
    }
  }

  return (await copyTextRobust(text)) ? 'copied' : 'failed';
}
