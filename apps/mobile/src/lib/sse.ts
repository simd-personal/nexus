export type SseEvent = {
  event: string;
  data: Record<string, unknown>;
};

export function parseSseChunk(buffer: string): { events: SseEvent[]; remainder: string } {
  const events: SseEvent[] = [];
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() ?? '';

  for (const part of parts) {
    if (!part.trim()) continue;
    let eventName = 'message';
    let dataLine = '';
    for (const line of part.split('\n')) {
      if (line.startsWith('event: ')) eventName = line.slice(7);
      if (line.startsWith('data: ')) dataLine = line.slice(6);
    }
    if (!dataLine) continue;
    try {
      events.push({ event: eventName, data: JSON.parse(dataLine) as Record<string, unknown> });
    } catch {
      // skip malformed chunks
    }
  }

  return { events, remainder };
}
