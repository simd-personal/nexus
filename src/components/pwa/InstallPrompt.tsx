'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import {
  dismissInstallPrompt,
  isBeforeInstallPromptEvent,
  isInstallPromptDismissed,
  isIosSafari,
  isMobileBrowser,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa/install';

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplayMode() || isInstallPromptDismissed() || !isMobileBrowser()) {
      return;
    }

    setVisible(true);

    function onBeforeInstallPrompt(event: Event) {
      if (!isBeforeInstallPromptEvent(event)) return;
      event.preventDefault();
      setDeferredPrompt(event);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const handleDismiss = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (!visible) return null;

  const ios = isIosSafari();

  return (
    <div
      className="pwa-install-banner shrink-0 border-t border-[var(--ud-cloud)] bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-[var(--brand-border)] dark:bg-[var(--brand-bg-secondary)]/95 lg:hidden"
      role="region"
      aria-label={`Install ${APP_NAME}`}
    >
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.12)] text-[var(--brand-accent)]">
          {ios ? <Share className="h-4 w-4" aria-hidden /> : <Smartphone className="h-4 w-4" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Install {APP_NAME}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {ios ? (
              <>
                Tap <span className="font-medium text-gray-800 dark:text-gray-200">Share</span>, then{' '}
                <span className="font-medium text-gray-800 dark:text-gray-200">Add to Home Screen</span> for quick
                access to Sunny and critical items.
              </>
            ) : deferredPrompt ? (
              <>Add {APP_NAME} to your home screen for faster access to your dashboard and Sunny chat.</>
            ) : (
              <>Use your browser menu to install {APP_NAME} on your home screen.</>
            )}
          </p>
          {!ios && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-accent-dark)] disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {installing ? 'Installing…' : 'Install app'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[var(--ud-cloud)] dark:hover:text-gray-200"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
