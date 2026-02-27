/**
 * Opens a URL in the system browser (Safari/Chrome) on native platforms,
 * or in a new tab on web.
 */
export const openExternalUrl = async (url: string) => {
  if (!url) return;
  
  const isNative = typeof (window as any).Capacitor !== 'undefined' && 
    (window as any).Capacitor.isNativePlatform?.();

  if (isNative) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } catch (error) {
      console.error('Error opening URL with Capacitor Browser:', error);
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
};
