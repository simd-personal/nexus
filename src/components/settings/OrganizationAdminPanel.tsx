'use client';

import { useState } from 'react';
import { reviewAccessRequest, updateMemberRole } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/Button';
import type { Organization, OrganizationMember, OrganizationMemberRole } from '@/types/database';

export function OrganizationAdminPanel({
  organization,
  membership,
  members,
  requests,
}: {
  organization: Organization;
  membership: OrganizationMember;
  members: OrganizationMember[];
  requests: Array<{ id: string; user_id: string; message: string | null; created_at: string }>;
}) {
  const [message, setMessage] = useState('');
  const isAdmin = membership.role === 'owner' || membership.role === 'admin';

  async function handleReview(requestId: string, approve: boolean) {
    const result = await reviewAccessRequest(requestId, approve);
    setMessage(result.error ?? (approve ? 'Access approved.' : 'Access denied.'));
  }

  async function handleRoleChange(memberId: string, role: OrganizationMemberRole) {
    const result = await updateMemberRole(memberId, role);
    setMessage(result.error ?? 'Member role updated.');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-medium text-gray-900 dark:text-gray-100">{organization.name}</p>
        <p className="mt-1 capitalize">{organization.industry} tenant</p>
        <p className="mt-1">
          Your role: <span className="font-medium capitalize">{membership.role}</span>
        </p>
        {organization.phi_protection_enabled && (
          <p className="mt-2 text-amber-800">
            PHI redaction is enabled for uploads in this organization.
          </p>
        )}
      </div>

      {message && <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>}

      {isAdmin && requests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Pending access requests</h3>
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-900 dark:text-gray-100">User {request.user_id.slice(0, 8)}…</p>
                {request.message && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{request.message}</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => handleReview(request.id, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleReview(request.id, false)}>
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Team members</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{member.user_id.slice(0, 8)}…</p>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
                </div>
                {member.role !== 'owner' && member.user_id !== membership.user_id && (
                  <select
                    defaultValue={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as OrganizationMemberRole)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
