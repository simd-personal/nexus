import { APP_DOMAIN } from '@/lib/constants';

export function getInboundEmailDomain(): string {
  return process.env.INBOUND_EMAIL_DOMAIN?.trim() || `inbound.${APP_DOMAIN}`;
}

export function buildProjectInboundAddress(token: string): string {
  return `p.${token}@${getInboundEmailDomain()}`;
}

export function buildUserInboundAddress(token: string): string {
  return `u.${token}@${getInboundEmailDomain()}`;
}

export function parseInboundRecipient(address: string): {
  type: 'project' | 'user';
  token: string;
} | null {
  const local = address.trim().toLowerCase().split('@')[0] ?? '';
  const projectMatch = local.match(/^p\.([a-z0-9]+)$/);
  if (projectMatch) {
    return { type: 'project', token: projectMatch[1] };
  }

  const userMatch = local.match(/^u\.([a-z0-9]+)$/);
  if (userMatch) {
    return { type: 'user', token: userMatch[1] };
  }

  return null;
}

export function extractInboundRecipients(addresses: string[]): Array<{ type: 'project' | 'user'; token: string }> {
  const results: Array<{ type: 'project' | 'user'; token: string }> = [];
  for (const address of addresses) {
    const parsed = parseInboundRecipient(address);
    if (parsed) results.push(parsed);
  }
  return results;
}
