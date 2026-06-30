export const INSTALL_PROMPT_DISMISS_KEY = 'upperdeck-install-prompt-dismissed-at';

/** Days to wait before showing the install prompt again after dismiss. */
export const INSTALL_PROMPT_DISMISS_DAYS = 7;

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return mediaStandalone || iosStandalone;
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isInstallPromptDismissed(now = Date.now()): boolean {
  if (typeof localStorage === 'undefined') return false;

  const raw = localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY);
  if (!raw) return false;

  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;

  const ttlMs = INSTALL_PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return now - dismissedAt < ttlMs;
}

export function dismissInstallPrompt(now = Date.now()): void {
  localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(now));
}

export function clearInstallPromptDismissal(): void {
  localStorage.removeItem(INSTALL_PROMPT_DISMISS_KEY);
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event && typeof (event as BeforeInstallPromptEvent).prompt === 'function';
}
