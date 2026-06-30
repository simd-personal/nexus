'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'development') return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal — install still works via manifest on supported browsers.
    });
  }, []);

  return null;
}
