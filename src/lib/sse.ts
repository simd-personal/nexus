export type SunnyStreamEvent =
  | { event: 'status'; data: { message: string } }
  | { event: 'session'; data: { session_id: string; title?: string } }
  | { event: 'token'; data: { text: string } }
  | { event: 'results'; data: { results: unknown[] } }
  | { event: 'meta'; data: Record<string, unknown> }
  | { event: 'artifact'; data: { type: string; title: string; content: string } }
  | { event: 'done'; data: Record<string, unknown> }
  | { event: 'error'; data: { message: string } };

export function encodeSse(event: SunnyStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export function parseSseChunk(buffer: string): { events: SunnyStreamEvent[]; remainder: string } {
  const events: SunnyStreamEvent[] = [];
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
      events.push({
        event: eventName,
        data: JSON.parse(dataLine),
      } as SunnyStreamEvent);
    } catch {
      // skip malformed
    }
  }

  return { events, remainder };
}
