'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Mail, Paperclip, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils';
import { hasAssignableInboundContent } from '@/lib/inbound/pending-content';
import type { InboundEmailEvent, ProjectWithStats } from '@/types/database';

type ProjectOption = { id: string; label: string };

type EmailView = {
  from: string;
  subject: string;
  text: string;
  attachments: Array<{ filename: string; contentType: string; size: number }>;
  contentAvailable: boolean;
  assignable: boolean;
};

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
          description="These forwards reached your smart inbox but did not match a project. View, assign, or dismiss them below."
        />
        <div className="space-y-4">
          {emails.map((email) => (
            <PendingInboundRow key={email.id} email={email} initialProjects={projects} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PendingInboundRow({
  email,
  initialProjects,
}: {
  email: InboundEmailEvent;
  initialProjects: ProjectWithStats[];
}) {
  const router = useRouter();
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>(() =>
    flattenProjects(initialProjects)
  );
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [viewData, setViewData] = useState<EmailView | null>(null);

  const assignable = hasAssignableInboundContent(email);

  useEffect(() => {
    if (projectOptions.length > 0) return;
    void fetch('/api/inbound/pending/projects')
      .then((res) => res.json())
      .then((data) => setProjectOptions(data.projects ?? []))
      .catch(() => setProjectOptions([]));
  }, [projectOptions.length]);

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
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/inbound/pending/${email.id}/dismiss`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not dismiss email');
        return;
      }
      setConfirmDismiss(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function openView() {
    setViewOpen(true);
    setViewLoading(true);
    setViewError('');
    try {
      const res = await fetch(`/api/inbound/pending/${email.id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setViewError(data.error ?? 'Could not load email');
        setViewData(null);
        return;
      }
      setViewData(data as EmailView);
    } finally {
      setViewLoading(false);
    }
  }

  return (
    <>
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
              <Button size="sm" variant="secondary" onClick={openView} className="shrink-0">
                <Eye className="h-4 w-4" />
                View
              </Button>
            </div>

            {email.body_preview && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                {email.body_preview}
              </p>
            )}

            {!assignable && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Message content was not saved for this entry. Forward the email again from Outlook, then
                assign the new item that appears here.
              </p>
            )}

            {confirmDismiss ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Remove this email from your inbox? It will not be added to any project.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="danger" onClick={handleDismiss} loading={loading}>
                    Confirm dismiss
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDismiss(false)} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    Assign to project
                  </label>
                  <select
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    disabled={loading || projectOptions.length === 0 || !assignable}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 disabled:opacity-60"
                  >
                    <option value="">Select a project</option>
                    {projectOptions.map((project) => (
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
                    disabled={projectOptions.length === 0 || !assignable}
                  >
                    Assign
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDismiss(true)} disabled={loading}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            {projectOptions.length === 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Create a project first, then assign this email.
              </p>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-[var(--ud-mist)]">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-[var(--ud-cloud)]">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">
                  {viewData?.subject ?? email.subject ?? '(No subject)'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-all">
                  {viewData?.from ?? email.from_address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[var(--ud-stone)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {viewLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading email…</p>
              ) : viewError ? (
                <p className="text-sm text-red-600">{viewError}</p>
              ) : (
                <>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap dark:bg-[var(--ud-stone)] dark:text-gray-200">
                    {viewData?.text}
                  </div>
                  {viewData?.attachments && viewData.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Attachments
                      </p>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {viewData.attachments.map((attachment) => (
                          <li key={attachment.filename} className="flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            {attachment.filename}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-200 px-5 py-4 dark:border-[var(--ud-cloud)]">
              <Button variant="secondary" onClick={() => setViewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function flattenProjects(projects: ProjectWithStats[]): ProjectOption[] {
  const rows: ProjectOption[] = [];

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
