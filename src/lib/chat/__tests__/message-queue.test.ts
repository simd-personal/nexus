import { describe, expect, it } from 'vitest';
import {
  MAX_QUEUED_MESSAGES,
  dequeueMessage,
  enqueueMessage,
  removeQueuedMessage,
} from '@/lib/chat/message-queue';

describe('message queue helpers', () => {
  it('enqueues trimmed messages up to the limit', () => {
    let queue = enqueueMessage([], '  hello  ')!;
    expect(queue).toEqual(['hello']);

    queue = enqueueMessage(queue, 'two')!;
    queue = enqueueMessage(queue, 'three')!;
    expect(queue).toHaveLength(3);
    expect(enqueueMessage(queue, 'four')).toBeNull();
    expect(queue).toHaveLength(MAX_QUEUED_MESSAGES);
  });

  it('dequeues in fifo order', () => {
    const queue = ['first', 'second'];
    const first = dequeueMessage(queue);
    expect(first.next).toBe('first');
    expect(first.queue).toEqual(['second']);
  });

  it('removes a queued message by index', () => {
    expect(removeQueuedMessage(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });
});
