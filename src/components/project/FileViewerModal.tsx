'use client';

import { Button } from '@/components/ui/Button';
import type { FileRecord } from '@/types/database';
import { FileText, Image as ImageIcon, Loader2, Table2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SpreadsheetSheet {
  name: string;
  rows: string[][];
}

interface FileViewPayload {
  fileName: string;
  mimeType: string;
  viewType: 'image' | 'pdf' | 'text' | 'spreadsheet' | 'docx' | 'unsupported';
  url: string | null;
  text: string | null;
  html?: string | null;
  sheets?: SpreadsheetSheet[];
  status: string;
  hasOriginal: boolean;
}

type PreviewTab = 'original' | 'spreadsheet' | 'formatted' | 'text';

function defaultPreviewTab(data: FileViewPayload): PreviewTab {
  if (data.viewType === 'spreadsheet' && data.sheets?.length) {
    return 'spreadsheet';
  }
  if (data.viewType === 'docx') {
    if (data.html?.trim()) return 'formatted';
    if (data.text?.trim()) return 'text';
  }
  if (!data.hasOriginal || data.viewType === 'text' || data.viewType === 'unsupported') {
    return 'text';
  }
  return 'original';
}

export function FileViewerModal({
  file,
  onClose,
}: {
  file: FileRecord;
  onClose: () => void;
}) {
  const [payload, setPayload] = useState<FileViewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<PreviewTab>('text');

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${file.id}/view`);
      if (!res.ok) {
        throw new Error('Could not load file preview');
      }
      const data = (await res.json()) as FileViewPayload;
      setPayload(data);
      setTab(defaultPreviewTab(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }, [file.id]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const showOriginalTab =
    payload?.hasOriginal &&
    payload.viewType !== 'text' &&
    payload.viewType !== 'spreadsheet' &&
    payload.viewType !== 'docx';
  const showSpreadsheetTab = payload?.viewType === 'spreadsheet' && Boolean(payload.sheets?.length);
  const showFormattedTab = payload?.viewType === 'docx' && Boolean(payload.html?.trim());
  const showTextTab = Boolean(payload?.text?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[var(--ud-mist)]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[var(--ud-cloud)]">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">{file.file_name}</h3>
            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{file.status.replaceAll('_', ' ')}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {(showOriginalTab || showSpreadsheetTab || showFormattedTab || showTextTab) && (
          <div className="flex gap-1 border-b border-gray-100 px-4 pt-2 dark:border-[var(--ud-cloud)]">
            {showFormattedTab && (
              <TabButton active={tab === 'formatted'} onClick={() => setTab('formatted')}>
                Formatted
              </TabButton>
            )}
            {showSpreadsheetTab && (
              <TabButton active={tab === 'spreadsheet'} onClick={() => setTab('spreadsheet')}>
                Spreadsheet
              </TabButton>
            )}
            {showOriginalTab && (
              <TabButton active={tab === 'original'} onClick={() => setTab('original')}>
                {payload?.viewType === 'image' ? 'Image' : payload?.viewType === 'pdf' ? 'PDF' : 'Original'}
              </TabButton>
            )}
            {showTextTab && (
              <TabButton active={tab === 'text'} onClick={() => setTab('text')}>
                Text
              </TabButton>
            )}
          </div>
        )}

        <div className="min-h-[320px] flex-1 overflow-auto bg-gray-50 p-4 dark:bg-[var(--ud-stone)]">
          {loading && (
            <div className="flex h-full min-h-[280px] items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading preview…
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <FileText className="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={loadPreview}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && payload && tab === 'original' && (
            <OriginalPreview payload={payload} />
          )}

          {!loading && !error && payload && tab === 'spreadsheet' && (
            <SpreadsheetPreview sheets={payload.sheets ?? []} />
          )}

          {!loading && !error && payload && tab === 'formatted' && (
            <FormattedPreview html={payload.html} status={payload.status} />
          )}

          {!loading && !error && payload && tab === 'text' && (
            <TextPreview text={payload.text} status={payload.status} viewType={payload.viewType} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-b-2 border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function OriginalPreview({ payload }: { payload: FileViewPayload }) {
  if (!payload.url) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No original file available for preview.
      </div>
    );
  }

  if (payload.viewType === 'image') {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={payload.url}
          alt={payload.fileName}
          className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
        />
      </div>
    );
  }

  if (payload.viewType === 'pdf') {
    return (
      <iframe
        src={payload.url}
        title={payload.fileName}
        className="h-[70vh] w-full rounded-lg border border-gray-200 bg-white"
      />
    );
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
      <ImageIcon className="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
      <p className="text-sm">Preview is not available for this file type.</p>
      {payload.text && <p className="mt-1 text-xs">Switch to the Text tab to read extracted content.</p>}
    </div>
  );
}

function FormattedPreview({ html, status }: { html?: string | null; status: string }) {
  if (!html?.trim()) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {status === 'processing' || status === 'pending'
          ? 'Formatted preview will appear once the file is ready.'
          : 'Could not render a formatted preview for this document.'}
      </div>
    );
  }

  return (
    <div
      className="docx-preview prose max-w-none rounded-lg border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-800 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SpreadsheetPreview({ sheets }: { sheets: SpreadsheetSheet[] }) {
  if (!sheets.length) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <Table2 className="mr-2 h-5 w-5" />
        No spreadsheet data found in this file.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sheets.map((sheet) => (
        <div key={sheet.name} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
          <div className="border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{sheet.name}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-[var(--ud-cloud)]">
              <tbody className="divide-y divide-gray-100 dark:divide-[var(--ud-cloud)]">
                {sheet.rows.map((row, rowIndex) => (
                  <tr key={`${sheet.name}-${rowIndex}`} className={rowIndex === 0 ? 'bg-gray-50 font-medium dark:bg-[var(--ud-stone)]' : ''}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${rowIndex}-${cellIndex}`}
                        className="whitespace-pre-wrap px-3 py-2 align-top text-gray-800 dark:text-gray-100"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextPreview({
  text,
  status,
  viewType,
}: {
  text: string | null;
  status: string;
  viewType: FileViewPayload['viewType'];
}) {
  if (!text?.trim()) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {status === 'processing' || status === 'pending'
          ? 'Text will appear here once Sunny finishes processing this file.'
          : viewType === 'spreadsheet'
            ? 'Could not read spreadsheet content.'
            : viewType === 'docx'
              ? 'No plain text available for this document.'
              : 'No extracted text available for this file.'}
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100">
      {text}
    </pre>
  );
}
