import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BillingContext } from '@/lib/billing/limits';

const state = {
  sessionIds: [] as string[],
  projectIds: [] as string[],
  sessionMessageCount: 0,
  legacyMessageCount: 0,
};

function fakeQuery(table: string) {
  const filters: Record<string, unknown> = {};
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      filters[column] = value;
      return builder;
    },
    in: (column: string, values: unknown[]) => {
      filters[`in:${column}`] = values;
      return builder;
    },
    is: (column: string, value: unknown) => {
      filters[`is:${column}`] = value;
      return builder;
    },
    gte: () => builder,
    single: () => Promise.resolve({ data: null }),
    then: (resolve: (value: unknown) => unknown) => {
      if (table === 'chat_sessions') {
        return Promise.resolve({ data: state.sessionIds.map((id) => ({ id })) }).then(resolve);
      }
      if (table === 'projects') {
        return Promise.resolve({ data: state.projectIds.map((id) => ({ id })) }).then(resolve);
      }
      if (table === 'chat_messages') {
        const legacy = 'is:session_id' in filters;
        return Promise.resolve({
          count: legacy ? state.legacyMessageCount : state.sessionMessageCount,
        }).then(resolve);
      }
      return Promise.resolve({ data: null }).then(resolve);
    },
  };
  return builder;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => fakeQuery(table),
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { checkChatQuota, countUserChatMessagesThisMonth } from '@/lib/billing/limits';

const freeBilling = { isPro: false, chatMessageLimit: 25 } as BillingContext;
const proBilling = { isPro: true, chatMessageLimit: 500 } as BillingContext;

describe('countUserChatMessagesThisMonth', () => {
  beforeEach(() => {
    state.sessionIds = [];
    state.projectIds = [];
    state.sessionMessageCount = 0;
    state.legacyMessageCount = 0;
  });

  it('counts session-based messages even when the user has no projects (global Sunny chat)', async () => {
    state.sessionIds = ['session-1'];
    state.sessionMessageCount = 7;

    expect(await countUserChatMessagesThisMonth('user-1')).toBe(7);
  });

  it('sums session messages and legacy project-only messages', async () => {
    state.sessionIds = ['session-1'];
    state.projectIds = ['project-1'];
    state.sessionMessageCount = 20;
    state.legacyMessageCount = 5;

    expect(await countUserChatMessagesThisMonth('user-1')).toBe(25);
  });

  it('returns 0 for a brand-new user with no sessions or projects', async () => {
    expect(await countUserChatMessagesThisMonth('user-1')).toBe(0);
  });
});

describe('checkChatQuota', () => {
  beforeEach(() => {
    state.sessionIds = ['session-1'];
    state.projectIds = ['project-1'];
    state.sessionMessageCount = 0;
    state.legacyMessageCount = 0;
  });

  it('allows a free user under the 25-message limit', async () => {
    state.sessionMessageCount = 24;

    const quota = await checkChatQuota('user-1', freeBilling);
    expect(quota.exceeded).toBe(false);
  });

  it('blocks a free user at the 25-message limit with an upgrade link', async () => {
    state.sessionMessageCount = 25;

    const quota = await checkChatQuota('user-1', freeBilling);
    expect(quota.exceeded).toBe(true);
    expect(quota.message).toContain('25 free Sunny messages');
    expect(quota.message).toContain('/upgrade?plan=pro');
  });

  it('blocks a free user whose messages are split across sessions and legacy project chat', async () => {
    state.sessionMessageCount = 13;
    state.legacyMessageCount = 12;

    const quota = await checkChatQuota('user-1', freeBilling);
    expect(quota.exceeded).toBe(true);
  });

  it('allows a Pro user past 25 messages up to the 500 soft cap', async () => {
    state.sessionMessageCount = 499;

    const quota = await checkChatQuota('user-1', proBilling);
    expect(quota.exceeded).toBe(false);
  });

  it('blocks a Pro user at the 500-message soft cap without an upgrade link', async () => {
    state.sessionMessageCount = 500;

    const quota = await checkChatQuota('user-1', proBilling);
    expect(quota.exceeded).toBe(true);
    expect(quota.message).not.toContain('/upgrade');
  });
});
