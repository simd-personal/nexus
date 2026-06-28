'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Loader2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatAttachmentSize, type InboundAttachmentViewType } from '@/lib/inbound/attachment-preview';
import { cn } from '@/lib/utils';

export type PendingEmailAttachment = {
  index: number;
  filename: string;
  contentType: string;
  size: number;
  inline?: boolean;
  viewType: InboundAttachmentViewType;
  previewUrl: string;
};

export type PendingEmailView = {
  from: string;
  subject: string;
  text: string;
  attachments: PendingEmailAttachment[];
  contentAvailable: boolean;
  assignable: boolean;
};

export function PendingInboundEmailPreview({
  emailId,
  fallbackSubject,
  fallbackFrom,
  open,
  loading,
  error,
  data,
  onClose,
}: {
  emailId: string;
  fallbackSubject: string | null;
  fallbackFrom: string | null;
  open: boolean;
  loading: boolean;
  error: string;
  data: PendingEmailView | null;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const attachments = data?.attachments ?? [];
  const selectedAttachment =
    selectedIndex === null ? null : attachments.find((item) => item.index === selectedIndex) ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedIndex(null);
      setPreviewError('');
      setPreviewText(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (attachments.length > 0) {
      setSelectedIndex(attachments[0].index);
    } else {
      setSelectedIndex(null);
    }
  }, [open, emailId, attachments.length]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !selectedAttachment) {
      setPreviewLoading(false);
      setPreviewError('');
      setPreviewText(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    const currentUrl = previewUrl;

    async function loadPreview() {
      setPreviewLoading(true);
      setPreviewError('');
      setPreviewText(null);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      setPreviewUrl(null);

      try {
        const res = await fetch(selectedAttachment.previewUrl);
        if (!res.ok) {
          throw new Error('Could not load attachment preview');
        }

        if (selectedAttachment.viewType === 'text') {
          const text = await res.text();
          if (!cancelled) setPreviewText(text);
          return;
        }

        if (selectedAttachment.viewType === 'download') {
          if (!cancelled) setPreviewError('Preview is not available for this file type. Download it instead.');
          return;
        }

        const blob = await res.blob();
        if (!cancelled) {
          setPreviewUrl(URL.createObjectURL(blob));
        }
      } catch {
        if (!cancelled) setPreviewError('Could not load attachment preview');
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedAttachment?.index, selectedAttachment?.previewUrl, selectedAttachment?.viewType]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close email preview"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-[var(--ud-mist)]">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-[var(--ud-cloud)]">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">
              {data?.subject ?? fallbackSubject ?? '(No subject)'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-all">
              {data?.from ?? fallbackFrom}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[var(--ud-stone)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading email…
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="space-y-6">
              <section>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Message
                </h4>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-200">
                  {data?.text}
                </div>
              </section>

              {attachments.length > 0 && (
                <section>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Attachments ({attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <button
                        key={`${attachment.index}-${attachment.filename}`}
                        type="button"
                        onClick={() => setSelectedIndex(attachment.index)}
                        className={cn(
                          'flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          selectedIndex === attachment.index
                            ? 'border-gray-900 bg-gray-100 text-gray-900 dark:border-gray-100 dark:bg-[var(--ud-cloud)] dark:text-gray-100'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-300 dark:hover:bg-[var(--ud-stone)]'
                        )}
                      >
                        {attachment.viewType === 'image' ? (
                          <ImageIcon className="h-4 w-4 shrink-0" />
                        ) : (
                          <Paperclip className="h-4 w-4 shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{attachment.filename}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {formatAttachmentSize(attachment.size)}
                            {attachment.inline ? ' · from email body' : ''}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedAttachment && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]">
                      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-[var(--ud-cloud)]">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {selectedAttachment.filename}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedAttachment.contentType}
                          </p>
                        </div>
                        <a
                          href={`${selectedAttachment.previewUrl}?download=1`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>

                      <div className="max-h-80 overflow-auto p-4">
                        {previewLoading ? (
                          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading preview…
                          </div>
                        ) : previewError ? (
                          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center text-sm text-gray-600 dark:text-gray-300">
                            <FileText className="h-8 w-8 text-gray-400" />
                            <p>{previewError}</p>
                            <a
                              href={`${selectedAttachment.previewUrl}?download=1`}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-200"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download file
                            </a>
                          </div>
                        ) : selectedAttachment.viewType === 'image' && previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={selectedAttachment.filename}
                            className="mx-auto max-h-72 w-auto max-w-full rounded-lg object-contain"
                          />
                        ) : selectedAttachment.viewType === 'pdf' && previewUrl ? (
                          <iframe
                            src={previewUrl}
                            title={selectedAttachment.filename}
                            className="h-72 w-full rounded-lg border border-gray-200 bg-white dark:border-[var(--ud-cloud)]"
                          />
                        ) : selectedAttachment.viewType === 'text' && previewText ? (
                          <pre className="whitespace-pre-wrap break-words text-xs text-gray-800 dark:text-gray-200">
                            {previewText}
                          </pre>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No preview available.</p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4 dark:border-[var(--ud-cloud)]">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
