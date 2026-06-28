const STOP_WORDS = new Set([
  'me', 'my', 'the', 'and', 'for', 'are', 'was', 'were', 'has', 'have', 'had',
  'tell', 'everything', 'latest', 'about', 'what', 'when', 'where', 'who',
  'how', 'all', 'any', 'can', 'you', 'from', 'with', 'that', 'this', 'into',
  'show', 'find', 'give', 'list', 'get', 'does', 'did', 'anyone', 'anything',
]);

export function extractSearchTerms(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 2 && !STOP_WORDS.has(term))
  )];
}

export function textMatchesTerms(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}
