import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PwaInstallContext = createContext({
  canInstall: false,
  installApp: async () => false,
  isInstalled: false,
});

export const PwaInstallProvider = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [manualPromptOpen, setManualPromptOpen] = useState(false);
  const [isIosInstallable, setIsIosInstallable] = useState(false);
  const [isGenericMobileInstallable, setIsGenericMobileInstallable] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const userAgent = window.navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(userAgent);
    const isSafari = /safari/i.test(userAgent) && !/crios|fxios|edgios/i.test(userAgent);
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);

    const updateInstalledState = () => {
      const installed = mediaQuery.matches || window.navigator.standalone === true;
      setIsInstalled(installed);
      setIsIosInstallable(isIos && isSafari && !installed);
      setIsGenericMobileInstallable(isMobile && !installed);
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    updateInstalledState();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener?.('change', updateInstalledState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', updateInstalledState);
    };
  }, []);

  const value = useMemo(() => ({
    canInstall: (!isInstalled && Boolean(installPrompt)) || isIosInstallable || isGenericMobileInstallable,
    isInstalled,
    installApp: async () => {
      if (isIosInstallable) {
        setManualPromptOpen(true);
        return true;
      }
      if (!installPrompt) {
        if (isGenericMobileInstallable) {
          setManualPromptOpen(true);
          return true;
        }
        return false;
      }
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      return result.outcome === 'accepted';
    },
  }), [installPrompt, isInstalled, isIosInstallable, isGenericMobileInstallable]);

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      {manualPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border/60 p-5 shadow-2xl">
            <div className="text-base font-semibold text-foreground">Install Pulse</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isIosInstallable
                ? 'On iPhone or iPad, tap the Share button in Safari, then choose Add to Home Screen.'
                : 'If your browser does not show the native install prompt yet, open the browser menu and choose Install App or Add to Home Screen.'}
            </p>
            <button
              onClick={() => setManualPromptOpen(false)}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => useContext(PwaInstallContext);
