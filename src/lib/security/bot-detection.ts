import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/admin';

/**
 * Lightweight, heuristic bot/abuse detection. No ML, no token spend — it runs
 * before we call any model. Each request updates a per-user signals row and
 * accumulates a suspicion score from cheap behavioral tells. When the score
 * crosses a threshold we put the user into an escalating cooldown.
 *
 * This is deliberately "good enough": it fails open and races are acceptable,
 * since the worst case is an abuser getting one extra request through.
 */

const MIN_HUMAN_GAP_MS = 700; // Sends faster than this look scripted.
const ROBOTIC_SAMPLE_SIZE = 5; // Intervals needed to judge cadence regularity.
const ROBOTIC_STDDEV_MS = 60; // Very steady timing => likely a loop.
const REPEAT_THRESHOLD = 3; // Identical message N times in a row.
const SUSPICION_THRESHOLD = 4; // Score at which we trigger a cooldown.
const MAX_TRACKED_INTERVALS = 8;

// Escalating cooldown durations (seconds) indexed by how deep the user is.
const COOLDOWN_LADDER_SEC = [5 * 60, 15 * 60, 60 * 60];

const HEADLESS_UA_PATTERNS = [
  /python-requests/i,
  /\bcurl\//i,
  /\bwget\b/i,
  /node-fetch/i,
  /axios/i,
  /headlesschrome/i,
  /phantomjs/i,
  /scrapy/i,
  /\bgo-http-client\b/i,
  /\bokhttp\b/i,
];

export interface BotSignalInput {
  userId: string;
  /** Raw text of the user's message/query, used for repetition detection. */
  message: string;
  /** `user-agent` request header, if any. */
  userAgent: string | null;
  /** Whether the request had a valid same-origin `origin`/`referer`. */
  sameOrigin: boolean;
  /** Hidden honeypot field value from the client; non-empty => bot. */
  honeypot?: string | null;
  endpoint: string;
  ip: string | null;
}

export interface BotVerdict {
  blocked: boolean;
  /** Seconds the caller should ask the user to wait. */
  retryAfter: number;
  score: number;
  reasons: string[];
}

const ALLOW: BotVerdict = { blocked: false, retryAfter: 0, score: 0, reasons: [] };

function hashMessage(message: string): string {
  return createHash('sha1').update(message.trim().toLowerCase()).digest('hex');
}

function stddev(values: number[]): number {
  if (values.length < 2) return Number.POSITIVE_INFINITY;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

interface SignalsRow {
  user_id: string;
  last_request_at: string | null;
  last_message_hash: string | null;
  repeat_count: number;
  recent_intervals_ms: number[];
  suspicion_score: number;
  cooldown_until: string | null;
}

export async function evaluateRequest(input: BotSignalInput): Promise<BotVerdict> {
  const supabase = createServiceClient();
  const now = Date.now();

  let row: SignalsRow | null = null;
  try {
    const { data } = await supabase
      .from('request_signals')
      .select(
        'user_id, last_request_at, last_message_hash, repeat_count, recent_intervals_ms, suspicion_score, cooldown_until'
      )
      .eq('user_id', input.userId)
      .maybeSingle();
    row = (data as SignalsRow | null) ?? null;
  } catch {
    return ALLOW; // Fail open on read errors.
  }

  // Already cooling down? Short-circuit without burning model calls.
  if (row?.cooldown_until) {
    const until = new Date(row.cooldown_until).getTime();
    if (until > now) {
      return {
        blocked: true,
        retryAfter: Math.ceil((until - now) / 1000),
        score: row.suspicion_score,
        reasons: ['active_cooldown'],
      };
    }
  }

  const reasons: string[] = [];
  let score = 0;

  // 1) Honeypot — a hidden field real users never fill. Very high signal.
  if (input.honeypot && input.honeypot.trim().length > 0) {
    score += SUSPICION_THRESHOLD;
    reasons.push('honeypot_filled');
  }

  // 2) Client fingerprint heuristics.
  const ua = input.userAgent ?? '';
  if (!ua || ua.trim().length < 10) {
    score += 2;
    reasons.push('missing_user_agent');
  } else if (HEADLESS_UA_PATTERNS.some((re) => re.test(ua))) {
    score += 3;
    reasons.push('automation_user_agent');
  }
  if (!input.sameOrigin) {
    score += 1;
    reasons.push('cross_origin');
  }

  // 3) Cadence — gap since the previous request.
  const lastAt = row?.last_request_at ? new Date(row.last_request_at).getTime() : null;
  const gap = lastAt ? now - lastAt : null;
  const intervals = [...(row?.recent_intervals_ms ?? [])];
  if (gap !== null) {
    // Clamp before storing: gaps only matter up to ~1h for cadence, and large
    // raw values (idle users) would overflow the INTEGER[] column.
    intervals.push(Math.min(gap, 3_600_000));
    while (intervals.length > MAX_TRACKED_INTERVALS) intervals.shift();
    if (gap < MIN_HUMAN_GAP_MS) {
      score += 2;
      reasons.push('inhuman_speed');
    }
    if (
      intervals.length >= ROBOTIC_SAMPLE_SIZE &&
      stddev(intervals.slice(-ROBOTIC_SAMPLE_SIZE)) < ROBOTIC_STDDEV_MS
    ) {
      score += 2;
      reasons.push('robotic_cadence');
    }
  }

  // 4) Repetition — same message fired repeatedly.
  const hash = hashMessage(input.message);
  let repeatCount = row?.last_message_hash === hash ? (row?.repeat_count ?? 0) + 1 : 0;
  if (repeatCount >= REPEAT_THRESHOLD) {
    score += 2;
    reasons.push('repeated_message');
  }

  const blocked = score >= SUSPICION_THRESHOLD;

  // Escalate cooldown depth based on prior suspicion history.
  let cooldownUntilIso: string | null = null;
  let retryAfter = 0;
  let nextSuspicion = row?.suspicion_score ?? 0;

  if (blocked) {
    const tier = Math.min(nextSuspicion, COOLDOWN_LADDER_SEC.length - 1);
    const cooldownSec = COOLDOWN_LADDER_SEC[tier];
    retryAfter = cooldownSec;
    cooldownUntilIso = new Date(now + cooldownSec * 1000).toISOString();
    nextSuspicion += 1;
    repeatCount = 0; // Reset so they don't immediately re-trip after cooldown.

    // Audit log for monitoring + manual review.
    void supabase
      .from('abuse_events')
      .insert({
        user_id: input.userId,
        ip: input.ip,
        kind: 'bot_cooldown',
        score,
        endpoint: input.endpoint,
        metadata: { reasons, retry_after: cooldownSec },
      })
      .then(undefined, () => {});
  } else {
    // Decay suspicion slowly when the user behaves.
    nextSuspicion = Math.max(0, nextSuspicion - (gap !== null && gap > 30_000 ? 1 : 0));
  }

  // Persist updated signals (best-effort).
  void supabase
    .from('request_signals')
    .upsert(
      {
        user_id: input.userId,
        last_request_at: new Date(now).toISOString(),
        last_message_hash: hash,
        repeat_count: repeatCount,
        recent_intervals_ms: intervals,
        suspicion_score: nextSuspicion,
        cooldown_until: cooldownUntilIso,
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .then(undefined, () => {});

  if (blocked) {
    return { blocked: true, retryAfter, score, reasons };
  }
  return { blocked: false, retryAfter: 0, score, reasons };
}
