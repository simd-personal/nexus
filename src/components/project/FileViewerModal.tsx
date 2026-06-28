'use client';

import { Button } from '@/components/ui/Button';
import type { FileRecord } from '@/types/database';
import { FileText, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface FileViewPayload {
  fileName: string;
  mimeType: string;
  viewType: 'image' | 'pdf' | 'text' | 'unsupported';
  url: string | null;
  text: string | null;
  status: string;
  hasOriginal: boolean;
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
  const [tab, setTab] = useState<'original' | 'text'>('original');

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
      if (!data.hasOriginal || data.viewType === 'text') {
        setTab('text');
      } else {
        setTab('original');
      }
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

  const showOriginalTab = payload?.hasOriginal && payload.viewType !== 'text';
  const showTextTab = Boolean(payload?.text?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">{file.file_name}</h3>
            <p className="text-xs text-gray-500 capitalize">{file.status.replace('_', ' ')}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {(showOriginalTab || showTextTab) && (
          <div className="flex gap-1 border-b border-gray-100 px-4 pt-2">
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

        <div className="min-h-[320px] flex-1 overflow-auto bg-gray-50 p-4">
          {loading && (
            <div className="flex h-full min-h-[280px] items-center justify-center text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading preview…
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <FileText className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={loadPreview}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && payload && tab === 'original' && (
            <OriginalPreview payload={payload} />
          )}

          {!loading && !error && payload && tab === 'text' && (
            <TextPreview text={payload.text} status={payload.status} />
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
          ? 'border-b-2 border-gray-900 text-gray-900'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function OriginalPreview({ payload }: { payload: FileViewPayload }) {
  if (!payload.url) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-gray-500">
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
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-gray-500">
      <ImageIcon className="mb-2 h-8 w-8 text-gray-400" />
      <p className="text-sm">Preview is not available for this file type.</p>
      {payload.text && <p className="mt-1 text-xs">Switch to the Text tab to read extracted content.</p>}
    </div>
  );
}

function TextPreview({ text, status }: { text: string | null; status: string }) {
  if (!text?.trim()) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-gray-500">
        {status === 'processing' || status === 'pending'
          ? 'Text will appear here once Sunny finishes processing this file.'
          : 'No extracted text available for this file.'}
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800">
      {text}
    </pre>
  );
}
