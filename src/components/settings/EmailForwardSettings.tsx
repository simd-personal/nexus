'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UserInboundInfo {
  address: string;
  subject_hint: string;
}

export function EmailForwardSettings() {
  const [info, setInfo] = useState<UserInboundInfo | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/account/inbound');
      if (!res.ok) {
        if (!cancelled) setError('Could not load your forwarding address');
        return;
      }
      const data = await res.json();
      if (!cancelled) setInfo(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function copyAddress() {
    if (!info?.address) return;
    await navigator.clipboard.writeText(info.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!info) {
    return <p className="text-sm text-gray-500">Loading forwarding address…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Your smart inbox
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Forward to one address for all projects. UpperDeck picks the project from the subject line.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
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
              <strong>Outlook:</strong> Forward the email to your smart inbox. Include the client and project in
              the subject, e.g. <code className="text-xs">{info.subject_hint}</code>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For a single project every time, use that project&apos;s address on the Files tab instead — no
              subject matching required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
