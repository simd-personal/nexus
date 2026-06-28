'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Paperclip } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils';
import type { InboundEmailEvent, ProjectWithStats } from '@/types/database';

export function PendingInboundInbox({
  emails,
  projects,
}: {
  emails: InboundEmailEvent[];
  projects: ProjectWithStats[];
}) {
  if (!emails.length) return null;

  return (
    <div className="mb-6 sm:mb-8">
      <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader
          title="Unassigned emails"
          description="These forwards reached your smart inbox but did not match a project. Assign them below."
        />
        <div className="space-y-4">
          {emails.map((email) => (
            <PendingInboundRow key={email.id} email={email} projects={projects} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PendingInboundRow({
  email,
  projects,
}: {
  email: InboundEmailEvent;
  projects: ProjectWithStats[];
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const flatProjects = flattenProjects(projects);
  const contentMissing = !email.payload_storage_path;

  async function handleAssign() {
    if (!projectId) {
      setError('Choose a project');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/inbound/pending/${email.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not assign email');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    if (!window.confirm('Dismiss this email? It will not be added to any project.')) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/inbound/pending/${email.id}/dismiss`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not dismiss email');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4 dark:border-blue-900/50 dark:bg-[var(--ud-mist)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                {email.subject || '(No subject)'}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 break-all">
                From {email.from_address}
                {' · '}
                {formatRelativeTime(email.created_at)}
                {email.attachment_count > 0 && (
                  <>
                    {' · '}
                    <span className="inline-flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {email.attachment_count} attachment{email.attachment_count === 1 ? '' : 's'}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {email.body_preview && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
              {email.body_preview}
            </p>
          )}

          {contentMissing && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Message content was not saved for this entry. Forward the email again from Outlook, then assign
              the new item that appears here.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Assign to project
              </label>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={loading || flatProjects.length === 0 || contentMissing}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 disabled:opacity-60"
              >
                <option value="">Select a project</option>
                {flatProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleAssign}
                loading={loading}
                disabled={flatProjects.length === 0 || contentMissing}
              >
                Assign
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={loading}>
                Dismiss
              </Button>
            </div>
          </div>

          {flatProjects.length === 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Create a project first, then assign this email.
            </p>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function flattenProjects(projects: ProjectWithStats[]): Array<{ id: string; label: string }> {
  const rows: Array<{ id: string; label: string }> = [];

  for (const project of projects) {
    rows.push({
      id: project.id,
      label: `${project.client_name} · ${project.project_name}`,
    });
    for (const child of project.sub_projects ?? []) {
      rows.push({
        id: child.id,
        label: `${child.client_name} · ${child.project_name}`,
      });
    }
  }

  return rows;
}
