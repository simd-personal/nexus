'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface InboundInfo {
  address: string;
  subject_hint: string;
  client_name?: string;
  project_name?: string;
}

export function EmailForwardCard({ projectId }: { projectId: string }) {
  const [info, setInfo] = useState<InboundInfo | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/projects/${projectId}/inbound`);
      if (!res.ok) {
        if (!cancelled) setError('Could not load forwarding address');
        return;
      }
      const data = await res.json();
      if (!cancelled) setInfo(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function copyAddress() {
    if (!info?.address) return;
    await navigator.clipboard.writeText(info.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader
        title="Forward from Outlook"
        description="Forward emails and attachments to this project. No drag and drop needed."
      />
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !info ? (
        <p className="text-sm text-gray-500">Loading forwarding address…</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Project inbox
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100">
                {info.address}
              </code>
              <Button type="button" variant="secondary" size="sm" onClick={copyAddress} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-300">
            <div className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="space-y-2">
                <p>
                  In Outlook, open an email and choose <strong>Forward</strong>, then paste this address.
                  Sunny will save the message and any attachments to this project.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tip: add <code className="text-xs">{info.subject_hint}</code> to the subject when using your
                  personal smart inbox from Settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
