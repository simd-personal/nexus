'use client';

import { useEffect, useState } from 'react';
import {
  UPLOAD_PROGRESS_END,
  UPLOAD_PROGRESS_START,
  type UploadProgressDetail,
} from '@/lib/upload/progress-events';

export function useUploadProgress() {
  const [progress, setProgress] = useState<UploadProgressDetail | null>(null);

  useEffect(() => {
    function onStart(event: Event) {
      setProgress((event as CustomEvent<UploadProgressDetail>).detail);
    }

    function onEnd() {
      setProgress(null);
    }

    window.addEventListener(UPLOAD_PROGRESS_START, onStart);
    window.addEventListener(UPLOAD_PROGRESS_END, onEnd);
    return () => {
      window.removeEventListener(UPLOAD_PROGRESS_START, onStart);
      window.removeEventListener(UPLOAD_PROGRESS_END, onEnd);
    };
  }, []);

  return progress;
}
