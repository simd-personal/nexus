import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockMaybeSingle = vi.fn();
const mockProjectsEq = vi.fn();
const mockFilesUpdateEq = vi.fn();
const mockDeleteUser = vi.fn();
const mockGetUserById = vi.fn();
const mockSubscriptionsCancel = vi.fn();
const mockCustomersDel = vi.fn();
const mockDeleteProjectAndFiles = vi.fn();
const mockRecordDeletedAccount = vi.fn();
const mockCountChatMessages = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: mockMaybeSingle,
        };
      }
      if (table === 'projects') {
        return {
          select: vi.fn(() => ({ eq: mockProjectsEq })),
        };
      }
      if (table === 'files') {
        return {
          update: vi.fn(() => ({ eq: mockFilesUpdateEq })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    auth: { admin: { deleteUser: mockDeleteUser, getUserById: mockGetUserById } },
  })),
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    subscriptions: { cancel: mockSubscriptionsCancel },
    customers: { del: mockCustomersDel },
  })),
}));

vi.mock('@/lib/projects/delete-project', () => ({
  deleteProjectAndFiles: (...args: unknown[]) => mockDeleteProjectAndFiles(...args),
}));

vi.mock('@/lib/auth/deleted-accounts', () => ({
  recordDeletedAccount: (...args: unknown[]) => mockRecordDeletedAccount(...args),
}));

vi.mock('@/lib/billing/limits', () => ({
  countUserChatMessagesThisMonth: (...args: unknown[]) => mockCountChatMessages(...args),
}));

import { deleteUserAccount } from '@/lib/account/delete-account';

describe('deleteUserAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({
      data: {
        account_type: 'individual',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        plan: 'pro',
        subscription_status: 'active',
      },
      error: null,
    });
    mockProjectsEq.mockResolvedValue({ data: [{ id: 'proj-1' }], error: null });
    mockFilesUpdateEq.mockResolvedValue({ error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockGetUserById.mockResolvedValue({ data: { user: { email: 'user@example.com' } } });
    mockSubscriptionsCancel.mockResolvedValue({});
    mockCustomersDel.mockResolvedValue({});
    mockDeleteProjectAndFiles.mockResolvedValue({ deletedFiles: 2 });
    mockRecordDeletedAccount.mockResolvedValue(undefined);
    mockCountChatMessages.mockResolvedValue(0);
  });

  it('cancels the subscription, deletes the Stripe customer, cleans projects, and deletes the user', async () => {
    const result = await deleteUserAccount('user-1');

    expect(result.error).toBeUndefined();
    expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_123');
    expect(mockCustomersDel).toHaveBeenCalledWith('cus_123');
    expect(mockDeleteProjectAndFiles).toHaveBeenCalledWith(expect.anything(), 'proj-1', 'user-1');
    expect(mockDeleteUser).toHaveBeenCalledWith('user-1');
  });

  it('blocks enterprise accounts', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { account_type: 'enterprise', stripe_customer_id: null, stripe_subscription_id: null },
      error: null,
    });

    const result = await deleteUserAccount('user-1');

    expect(result.status).toBe(403);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('skips Stripe teardown when the user never had a customer', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { account_type: 'individual', stripe_customer_id: null, stripe_subscription_id: null },
      error: null,
    });

    const result = await deleteUserAccount('user-1');

    expect(result.error).toBeUndefined();
    expect(mockSubscriptionsCancel).not.toHaveBeenCalled();
    expect(mockCustomersDel).not.toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith('user-1');
  });

  it('aborts before deleting the user when Stripe teardown fails', async () => {
    mockSubscriptionsCancel.mockRejectedValue(new Error('stripe down'));

    const result = await deleteUserAccount('user-1');

    expect(result.status).toBe(502);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('continues when a single project cleanup fails', async () => {
    mockProjectsEq.mockResolvedValue({
      data: [{ id: 'proj-1' }, { id: 'proj-2' }],
      error: null,
    });
    mockDeleteProjectAndFiles
      .mockResolvedValueOnce({ error: 'storage failed', status: 500 })
      .mockResolvedValueOnce({ deletedFiles: 1 });

    const result = await deleteUserAccount('user-1');

    expect(result.error).toBeUndefined();
    expect(mockDeleteProjectAndFiles).toHaveBeenCalledTimes(2);
    expect(mockDeleteUser).toHaveBeenCalledWith('user-1');
  });

  it('reports failure when the auth user delete fails', async () => {
    mockDeleteUser.mockResolvedValue({ error: { message: 'nope' } });

    const result = await deleteUserAccount('user-1');

    expect(result.status).toBe(500);
    expect(result.error).toContain('Could not delete');
    expect(mockRecordDeletedAccount).not.toHaveBeenCalled();
  });

  it('records paid accounts as re-signup eligible', async () => {
    await deleteUserAccount('user-1');

    expect(mockRecordDeletedAccount).toHaveBeenCalledWith({
      email: 'user@example.com',
      wasPaid: true,
      hitFreeLimit: true,
    });
  });

  it('records free accounts that used their project quota as blocked', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        account_type: 'individual',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: 'free',
        subscription_status: null,
      },
      error: null,
    });

    await deleteUserAccount('user-1');

    expect(mockRecordDeletedAccount).toHaveBeenCalledWith({
      email: 'user@example.com',
      wasPaid: false,
      hitFreeLimit: true,
    });
  });

  it('records untouched free accounts as re-signup eligible', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        account_type: 'individual',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: 'free',
        subscription_status: null,
      },
      error: null,
    });
    mockProjectsEq.mockResolvedValue({ data: [], error: null });
    mockCountChatMessages.mockResolvedValue(3);

    await deleteUserAccount('user-1');

    expect(mockRecordDeletedAccount).toHaveBeenCalledWith({
      email: 'user@example.com',
      wasPaid: false,
      hitFreeLimit: false,
    });
  });

  it('blocks free accounts that exhausted the monthly chat quota', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        account_type: 'individual',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: 'free',
        subscription_status: null,
      },
      error: null,
    });
    mockProjectsEq.mockResolvedValue({ data: [], error: null });
    mockCountChatMessages.mockResolvedValue(25);

    await deleteUserAccount('user-1');

    expect(mockRecordDeletedAccount).toHaveBeenCalledWith({
      email: 'user@example.com',
      wasPaid: false,
      hitFreeLimit: true,
    });
  });
});
