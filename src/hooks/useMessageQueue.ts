'use client';

import { useCallback, useRef, useState } from 'react';
import {
  MAX_QUEUED_MESSAGES,
  dequeueMessage,
  enqueueMessage,
  removeQueuedMessage,
} from '@/lib/chat/message-queue';

export { MAX_QUEUED_MESSAGES };

export function useMessageQueue(maxSize = MAX_QUEUED_MESSAGES) {
  const [queue, setQueue] = useState<string[]>([]);
  const queueRef = useRef<string[]>([]);

  const sync = useCallback((next: string[]) => {
    queueRef.current = next;
    setQueue(next);
  }, []);

  const enqueue = useCallback(
    (text: string) => {
      const next = enqueueMessage(queueRef.current, text, maxSize);
      if (!next) return false;
      sync(next);
      return true;
    },
    [maxSize, sync]
  );

  const dequeue = useCallback(() => {
    const { next, queue: rest } = dequeueMessage(queueRef.current);
    sync(rest);
    return next;
  }, [sync]);

  const removeAt = useCallback(
    (index: number) => {
      sync(removeQueuedMessage(queueRef.current, index));
    },
    [sync]
  );

  const clear = useCallback(() => sync([]), [sync]);

  return {
    queue,
    enqueue,
    dequeue,
    removeAt,
    clear,
    isFull: queue.length >= maxSize,
    maxSize,
  };
}
