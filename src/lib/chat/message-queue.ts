export const MAX_QUEUED_MESSAGES = 3;

export function enqueueMessage(queue: string[], text: string, maxSize = MAX_QUEUED_MESSAGES): string[] | null {
  const trimmed = text.trim();
  if (!trimmed || queue.length >= maxSize) return null;
  return [...queue, trimmed];
}

export function dequeueMessage(queue: string[]): { next: string | undefined; queue: string[] } {
  if (queue.length === 0) return { next: undefined, queue: [] };
  const [next, ...rest] = queue;
  return { next, queue: rest };
}

export function removeQueuedMessage(queue: string[], index: number): string[] {
  return queue.filter((_, i) => i !== index);
}
