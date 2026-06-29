import type { NextRequest } from 'next/server';
import { rateLimit, limitsForCost, type AiCost } from '@/lib/security/rate-limit';
import { evaluateRequest } from '@/lib/security/bot-detection';
import { tooManyRequestsResponse } from '@/lib/security/messages';

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get('host');
  if (!host) return false;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const source = origin ?? referer;
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

export interface GuardOptions {
  request: NextRequest;
  userId: string;
  isPro: boolean;
  cost: AiCost;
  /** The user's message/query, used for repetition heuristics. */
  message: string;
  /** Hidden honeypot field from the client, if present. */
  honeypot?: string | null;
}

/**
 * Gate an expensive AI request. Runs lightweight bot detection, then per-user
 * and per-IP rate limits. Returns a ready-to-send 429 `Response` when the
 * request should be rejected, or `null` when it's allowed to proceed.
 *
 * Order matters: bot detection first (so abusers get the friendly cooldown and
 * we log the event), then mechanical rate limits.
 */
export async function guardAiRequest(options: GuardOptions): Promise<Response | null> {
  const { request, userId, isPro, cost, message, honeypot } = options;
  const ip = clientIp(request);
  const endpoint = new URL(request.url).pathname;

  // 1) Behavioral bot/abuse detection.
  const verdict = await evaluateRequest({
    userId,
    message,
    honeypot,
    userAgent: request.headers.get('user-agent'),
    sameOrigin: isSameOrigin(request),
    endpoint,
    ip,
  });
  if (verdict.blocked) {
    return tooManyRequestsResponse(verdict.retryAfter);
  }

  // 2) Per-user mechanical rate limits (burst + sustained).
  const limits = limitsForCost(cost, isPro);
  const [perMinute, perHour] = await Promise.all([
    rateLimit({ key: `${cost}:user:${userId}:m`, max: limits.perMinute, windowSec: 60 }),
    rateLimit({ key: `${cost}:user:${userId}:h`, max: limits.perHour, windowSec: 3600 }),
  ]);
  if (!perMinute.allowed) return tooManyRequestsResponse(perMinute.retryAfter);
  if (!perHour.allowed) return tooManyRequestsResponse(perHour.retryAfter);

  // 3) Per-IP burst limit — catches one actor farming many accounts. Generous
  // because corporate users can share an egress IP.
  if (ip) {
    const perIp = await rateLimit({ key: `ip:${ip}:m`, max: 60, windowSec: 60 });
    if (!perIp.allowed) return tooManyRequestsResponse(perIp.retryAfter);
  }

  return null;
}
