/**
 * Opens a URL in the system browser (Safari/Chrome) on native platforms,
 * or in a new tab on web. Uses a temporary anchor element as fallback
 * to bypass iframe restrictions.
 */
export const openExternalUrl = async (url: string) => {
  if (!url) return;
  
  const isNative = typeof (window as any).Capacitor !== 'undefined' && 
    (window as any).Capacitor.isNativePlatform?.();

  if (isNative) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    } catch (error) {
      console.error('Error opening URL with Capacitor Browser:', error);
    }
  }

  // Web fallback: create a temporary anchor element to bypass iframe restrictions
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};
