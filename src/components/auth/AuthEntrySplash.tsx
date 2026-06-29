'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UpperDeckIcon } from '@/components/brand/UpperDeckLogo';
import { AI_EMPLOYEE_NAME, APP_NAME } from '@/lib/constants';

export type AuthEntryMode = 'signin' | 'signup';

const STATUS_LINES: Record<AuthEntryMode, string[]> = {
  signin: [
    'Signing you in…',
    'Loading your command center…',
    `Waking up ${AI_EMPLOYEE_NAME}…`,
    'Almost there…',
  ],
  signup: [
    'Creating your workspace…',
    `Setting up ${AI_EMPLOYEE_NAME}…`,
    'Preparing your first project…',
    'Almost ready…',
  ],
};

const COPY: Record<AuthEntryMode, { title: string; subtitle: string }> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Picking up where you left off.',
  },
  signup: {
    title: `Welcome to ${APP_NAME}`,
    subtitle: 'You can confirm your email with us later. Let’s get you started.',
  },
};

/** Minimum time the splash stays visible so it feels intentional, not flickery. */
const MIN_DISPLAY_MS: Record<AuthEntryMode, number> = {
  signin: 2000,
  signup: 2800,
};

type AuthEntrySplashProps = {
  mode: AuthEntryMode;
};

export function AuthEntrySplash({ mode }: AuthEntrySplashProps) {
  const copy = COPY[mode];
  const lines = STATUS_LINES[mode];
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 900);
    return () => window.clearInterval(id);
  }, [lines.length]);

  return (
    <div className="auth-onboarding" role="status" aria-live="polite" aria-busy="true">
      <div className="auth-onboarding-blob-a" aria-hidden />
      <div className="auth-onboarding-blob-b" aria-hidden />
      <div className="auth-onboarding-card">
        <div className="auth-onboarding-mark">
          <span className="auth-onboarding-ring" aria-hidden />
          <UpperDeckIcon size={56} className="auth-onboarding-icon" />
        </div>
        <h1 className="auth-onboarding-title">{copy.title}</h1>
        <p className="auth-onboarding-sub">{copy.subtitle}</p>
        <p key={lineIndex} className="auth-onboarding-status">
          {lines[lineIndex]}
        </p>
        <div className="auth-onboarding-progress" aria-hidden>
          <span className="auth-onboarding-progress-bar" />
        </div>
        <div className="auth-onboarding-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

/**
 * Full-screen splash while prefetching the post-auth route, then hard-navigates
 * so the animation stays visible until the next page loads (reliable in prod).
 */
export function AuthEntryTransition({
  mode,
  href,
}: {
  mode: AuthEntryMode;
  href: string;
}) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    router.prefetch(href);
    void fetch(href, { credentials: 'include', cache: 'no-store' }).catch(() => {});

    const minMs = MIN_DISPLAY_MS[mode];
    const shownAt = performance.now();

    const navigate = () => {
      window.location.assign(href);
    };

    const maxTimer = window.setTimeout(navigate, 8000);

    // Wait for paint, then hold the splash for the full minimum duration.
    let timer: number | undefined;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const elapsed = performance.now() - shownAt;
        const remaining = Math.max(0, minMs - elapsed);
        timer = window.setTimeout(() => {
          window.clearTimeout(maxTimer);
          navigate();
        }, remaining);
      });
    });

    return () => {
      window.clearTimeout(maxTimer);
      if (timer !== undefined) window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [href, mode, router]);

  return <AuthEntrySplash mode={mode} />;
}
