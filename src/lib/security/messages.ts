/**
 * Friendly, on-brand "slow down" copy for when a user trips a rate limit or the
 * lightweight bot heuristics. Sunny is the assistant persona — keep it warm and
 * a little playful so a real human who hit a burst limit isn't annoyed.
 */
const COFFEE_BREAK_MESSAGES = [
  '\u2615 Sunny needs a quick coffee break \u2014 back in a few minutes!',
  '\ud83d\ude34 Whoa, slow down speed racer! Sunny is catching its breath. Try again shortly.',
  "\ud83c\udf24\ufe0f Even the sun sets sometimes. Sunny is recharging \u2014 give it a few minutes.",
  '\ud83e\udeab Sunny ran a little low on rays. Back in a moment \u2014 thanks for your patience!',
  "\ud83c\udf1e You and Sunny are on a roll! Let's take a breather and pick this up in a few minutes.",
];

/**
 * Pick a friendly cooldown message. Optionally appends a concrete wait time so
 * the user knows roughly when to come back.
 */
export function coffeeBreakMessage(retryAfterSeconds?: number): string {
  const base =
    COFFEE_BREAK_MESSAGES[Math.floor(Math.random() * COFFEE_BREAK_MESSAGES.length)];

  if (!retryAfterSeconds || retryAfterSeconds <= 0) return base;

  const minutes = Math.ceil(retryAfterSeconds / 60);
  const wait =
    minutes <= 1 ? 'about a minute' : `about ${minutes} minutes`;
  return `${base} (Try again in ${wait}.)`;
}

/**
 * Build the standard 429 response used across the AI endpoints. The client's
 * stream hook reads `error` from the body and renders it directly in the chat
 * bubble, so the friendly copy shows up with no extra frontend work.
 */
export function tooManyRequestsResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error: coffeeBreakMessage(retryAfterSeconds),
      cooldown: true,
      retry_after: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(1, retryAfterSeconds)),
      },
    }
  );
}
