/** Max characters of indexed source material passed to the model per request. */
export const CONTEXT_CHUNK_CHAR_BUDGET = 96_000;

/** Max number of source chunks considered after budget fitting. */
export const ANSWER_CHUNK_MAX_COUNT = 22;

export function fitChunksToBudget<T extends { text: string }>(
  chunks: T[],
  maxChars = CONTEXT_CHUNK_CHAR_BUDGET,
  maxCount = ANSWER_CHUNK_MAX_COUNT
): T[] {
  const selected: T[] = [];
  let used = 0;

  for (const chunk of chunks) {
    if (selected.length >= maxCount) break;
    const len = chunk.text.length;
    if (used + len > maxChars && selected.length > 0) continue;
    if (len > maxChars && selected.length === 0) {
      selected.push({ ...chunk, text: chunk.text.slice(0, maxChars) } as T);
      break;
    }
    selected.push(chunk);
    used += len;
  }

  return selected;
}
