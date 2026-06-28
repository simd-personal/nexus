'use client';

import { useCallback, useRef, useState } from 'react';
import { parseSseChunk } from '@/lib/sse';
import type { Citation, SearchResult, SunnyChatArtifact } from '@/types/database';

export interface StreamMessageMeta {
  citations?: Citation[];
  confidence?: string;
  suggested_next_step?: string;
  actions_taken?: string[];
  model?: string;
  artifact?: SunnyChatArtifact;
  results?: SearchResult[];
}

interface StreamOptions {
  endpoint: string;
  body: Record<string, unknown>;
  onSession?: (sessionId: string, title?: string) => void;
  onStatus?: (message: string) => void;
  onToken?: (fullText: string) => void;
  onResults?: (results: SearchResult[]) => void;
  onMeta?: (meta: StreamMessageMeta) => void;
  onArtifact?: (artifact: SunnyChatArtifact) => void;
  onDone?: (sessionId: string) => void;
  onError?: (message: string) => void;
}

export function useSunnyStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (options: StreamOptions) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const res = await fetch(options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options.body),
        signal: controller.signal,
      });

      if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
          const err = await res.json();
          if (err.error) detail = err.error;
        } catch {
          // non-json body
        }
        throw new Error(detail);
      }
      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseChunk(buffer);
        buffer = remainder;

        for (const ev of events) {
          switch (ev.event) {
            case 'session':
              options.onSession?.(ev.data.session_id, ev.data.title);
              break;
            case 'status':
              options.onStatus?.(ev.data.message);
              break;
            case 'token':
              fullText += ev.data.text;
              options.onToken?.(fullText);
              break;
            case 'results':
              options.onResults?.(ev.data.results as SearchResult[]);
              break;
            case 'artifact':
              options.onArtifact?.(ev.data as SunnyChatArtifact);
              break;
            case 'meta':
              options.onMeta?.(ev.data as StreamMessageMeta);
              break;
            case 'done':
              options.onDone?.(ev.data.session_id as string);
              break;
            case 'error':
              options.onError?.(ev.data.message);
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        options.onError?.((err as Error).message ?? 'Stream failed');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { stream, stop, isStreaming };
}
