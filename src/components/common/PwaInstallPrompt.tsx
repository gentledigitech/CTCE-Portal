import React, { useEffect, useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle, Sparkles } from 'lucide-react';

interface PwaInstallPromptProps {
  forceShowModal?: boolean;
  onCloseModal?: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  forceShowModal = false,
  onCloseModal
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Catch beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const [installInfoNotice, setInstallInfoNotice] = useState<string | null>(null);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        if (onCloseModal) onCloseModal();
      }
    } else {
      // If no native prompt available
      setInstallInfoNotice('To install: In your browser menu (⋮ or Share), tap "Install app" or "Add to Home Screen".');
    }
  };

  // If user clicked Download App button explicitly, show modal
  if (forceShowModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-sky-300 dark:border-sky-800 shadow-2xl relative text-left">
          <button
            onClick={onCloseModal}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-sky-500 to-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
            <Download className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-black text-stone-900 dark:text-white mb-1">
            Download CTCE Portal App
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-5">
            Install the official Progressive Web App (PWA) on your Android, iPhone, tablet or PC for faster access and offline support.
          </p>

          <div className="space-y-3 mb-6 text-xs text-stone-700 dark:text-stone-300">
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 flex items-start gap-3">
              <Smartphone className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-stone-900 dark:text-white">Android / Chrome:</strong>
                Click the &ldquo;Install Now&rdquo; button below or tap the 3 dots menu and choose &ldquo;Install App&rdquo;.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-start gap-3">
              <Share2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-stone-900 dark:text-white">iOS Safari (iPhone/iPad):</strong>
                Tap the <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> Share icon, then select <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-stone-500" /> &ldquo;Add to Home Screen&rdquo;.
              </div>
            </div>
          </div>

          {installInfoNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs">
              {installInfoNotice}
            </div>
          )}

          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
        </div>
      </div>
    );
  }

  if (isStandalone || dismissed) {
    return null;
  }

  // Android / Desktop auto-prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-sky-700/60 flex items-center justify-between gap-3 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Install CTCE Portal</div>
            <p className="text-xs text-sky-200/80 leading-normal">
              Quick access on home screen & works offline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition min-h-[44px] flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install prompt"
            className="p-2 text-stone-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS-only banner
  if (isIOS && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-sky-800 flex items-start justify-between gap-3 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
            <Share2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xs text-stone-300 leading-relaxed">
            <span className="font-semibold text-white block mb-0.5">Install CTCE Portal on iOS</span>
            Tap <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> in Safari menu, then scroll and select{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-white">
              <PlusSquare className="w-3.5 h-3.5 text-stone-300" /> &ldquo;Add to Home Screen&rdquo;
            </span>.
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="p-2 text-stone-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
