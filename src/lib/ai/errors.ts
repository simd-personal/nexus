/** True when OpenAI rejected the request due to quota or rate limits. */
export function isOpenAIUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('insufficient_quota')
  );
}

/** Avoid leaking raw provider errors to the client. */
export function formatStreamError(error: unknown): string {
  if (isOpenAIUnavailable(error)) {
    return 'AI search is temporarily unavailable. Please try again in a moment.';
  }
  if (error instanceof Error) {
    if (/^\d{3}\s/.test(error.message)) {
      return 'Something went wrong while generating a response. Please try again.';
    }
    return error.message;
  }
  return 'Something went wrong.';
}
