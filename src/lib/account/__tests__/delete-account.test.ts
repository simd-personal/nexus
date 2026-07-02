import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockMaybeSingle = vi.fn();
const mockProjectsEq = vi.fn();
const mockFilesUpdateEq = vi.fn();
const mockDeleteUser = vi.fn();
const mockSubscriptionsCancel = vi.fn();
const mockCustomersDel = vi.fn();
const mockDeleteProjectAndFiles = vi.fn();

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
    auth: { admin: { deleteUser: mockDeleteUser } },
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

import { deleteUserAccount } from '@/lib/account/delete-account';

describe('deleteUserAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({
      data: {
        account_type: 'individual',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
      },
      error: null,
    });
    mockProjectsEq.mockResolvedValue({ data: [{ id: 'proj-1' }], error: null });
    mockFilesUpdateEq.mockResolvedValue({ error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockSubscriptionsCancel.mockResolvedValue({});
    mockCustomersDel.mockResolvedValue({});
    mockDeleteProjectAndFiles.mockResolvedValue({ deletedFiles: 2 });
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
  });
});
