import { parseSseChunk } from '@/lib/sse';

export type ChatStreamHandlers = {
  onSession?: (sessionId: string, title?: string) => void;
  onStatus?: (message: string) => void;
  onToken?: (fullText: string) => void;
  onResults?: (results: unknown) => void;
  onMeta?: (meta: Record<string, unknown>) => void;
  onArtifact?: (artifact: Record<string, unknown>) => void;
  onDone?: (sessionId: string) => void;
  onError?: (message: string) => void;
};

function applySseEvent(
  event: { event: string; data: Record<string, unknown> },
  handlers: ChatStreamHandlers,
  fullText: string
): string {
  switch (event.event) {
    case 'session':
      handlers.onSession?.(
        String(event.data.session_id),
        event.data.title ? String(event.data.title) : undefined
      );
      break;
    case 'status':
      handlers.onStatus?.(String(event.data.message ?? ''));
      break;
    case 'token': {
      const next = fullText + String(event.data.text ?? '');
      handlers.onToken?.(next);
      return next;
    }
    case 'results':
      handlers.onResults?.(event.data.results);
      break;
    case 'meta':
      handlers.onMeta?.(event.data);
      break;
    case 'artifact':
      handlers.onArtifact?.(event.data);
      break;
    case 'done':
      handlers.onDone?.(String(event.data.session_id));
      break;
    case 'error':
      handlers.onError?.(String(event.data.message ?? 'Stream error'));
      break;
  }
  return fullText;
}

export function consumeSseBuffer(
  buffer: string,
  handlers: ChatStreamHandlers,
  fullText: string
): { remainder: string; fullText: string } {
  const { events, remainder } = parseSseChunk(buffer);
  let text = fullText;
  for (const event of events) {
    text = applySseEvent(event, handlers, text);
  }
  return { remainder, fullText: text };
}

/** React Native fetch often buffers the body; XHR onprogress delivers SSE incrementally. */
export function streamChatWithXhr(
  url: string,
  token: string | null,
  body: string,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastIndex = 0;
    let buffer = '';
    let fullText = '';

    const flush = () => {
      const parsed = consumeSseBuffer(buffer, handlers, fullText);
      buffer = parsed.remainder;
      fullText = parsed.fullText;
    };

    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer += chunk;
      flush();
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const err = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(err.error ?? `Chat failed (${xhr.status})`));
        } catch {
          reject(new Error(`Chat failed (${xhr.status})`));
        }
        return;
      }

      if (lastIndex < xhr.responseText.length) {
        buffer += xhr.responseText.slice(lastIndex);
        flush();
      }
      resolve();
    };

    xhr.onerror = () => reject(new Error('Stream connection failed'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(body);
  });
}

export async function streamChatWithFetch(
  response: Response,
  handlers: ChatStreamHandlers
): Promise<void> {
  if (!response.body) {
    throw new Error('No response stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = consumeSseBuffer(buffer, handlers, fullText);
    buffer = parsed.remainder;
    fullText = parsed.fullText;
  }
}
