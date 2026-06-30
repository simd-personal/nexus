import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  INSTALL_PROMPT_DISMISS_DAYS,
  INSTALL_PROMPT_DISMISS_KEY,
  clearInstallPromptDismissal,
  dismissInstallPrompt,
  isBeforeInstallPromptEvent,
  isInstallPromptDismissed,
  isIosSafari,
  isMobileBrowser,
} from '@/lib/pwa/install';

describe('isBeforeInstallPromptEvent', () => {
  it('detects install prompt events', () => {
    const event = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    } as Event;

    expect(isBeforeInstallPromptEvent(event)).toBe(true);
    expect(isBeforeInstallPromptEvent(new Event('beforeinstallprompt'))).toBe(false);
  });
});

describe('install prompt dismissal', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  it('respects dismiss TTL', () => {
    const now = Date.now();
    dismissInstallPrompt(now);
    expect(localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY)).toBe(String(now));
    expect(isInstallPromptDismissed(now + 1000)).toBe(true);

    const expired = now + INSTALL_PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000 + 1;
    expect(isInstallPromptDismissed(expired)).toBe(false);
  });

  it('clears dismissal state', () => {
    dismissInstallPrompt();
    clearInstallPromptDismissal();
    expect(isInstallPromptDismissed()).toBe(false);
  });
});

describe('mobile platform detection', () => {
  it('detects iOS Safari user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    expect(isIosSafari()).toBe(true);
    expect(isMobileBrowser()).toBe(true);
  });

  it('excludes Chrome on iOS', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
    });
    expect(isIosSafari()).toBe(false);
  });
});
