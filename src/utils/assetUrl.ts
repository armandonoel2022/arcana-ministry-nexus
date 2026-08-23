import { Capacitor } from '@capacitor/core';

/**
 * Base pública donde viven los assets de Lovable (/__l5e/...).
 * En la app nativa el origen es capacitor://localhost, por lo que las rutas
 * relativas nunca resuelven: hay que apuntarlas al dominio público.
 */
const PUBLIC_ASSET_BASE =
  (import.meta.env.VITE_PUBLIC_ASSET_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://9ad580d0-87d1-43a0-9d97-fed34a5a6a68.lovableproject.com';

export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  const isNative = Capacitor.isNativePlatform?.() ?? false;
  if (!isNative) return url;

  return `${PUBLIC_ASSET_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
