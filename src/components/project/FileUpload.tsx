'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Mail, StickyNote, Mic } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  isFileDragEvent,
  kickFileProcessing,
  UPLOAD_ACCEPT,
} from '@/lib/upload/client';
import { notifyUploadEnd, notifyUploadStart } from '@/lib/upload/progress-events';
import { useUploadProgress } from '@/lib/upload/use-upload-progress';
import { UploadingFilesIndicator } from '@/components/project/UploadingFilesIndicator';
import {
  formatUploadApiError,
  pastedContentSuccessMessage,
  UPLOAD_ACCEPTED_TYPES_HINT,
  UPLOAD_BACKGROUND_NOTE,
  UPLOAD_MAX_SIZE_HINT,
  uploadBatchSuccessMessage,
} from '@/lib/upload/user-messages';
import { useProjectFileUpload } from '@/hooks/useProjectFileUpload';
import type { ProjectFileSummary } from '@/lib/upload/name-matching';

interface FileUploadProps {
  projectId: string;
  existingFiles?: ProjectFileSummary[];
  onUploadComplete?: () => void;
}

export function FileUploadCenter({ projectId, existingFiles, onUploadComplete }: FileUploadProps) {
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteMode, setPasteMode] = useState<'email' | 'meeting' | 'transcript' | 'note' | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState('');
  const uploadProgress = useUploadProgress();
  const isUploading = uploading || Boolean(uploadProgress);
  const { uploadFiles, collisionDialog } = useProjectFileUpload(projectId, { existingFiles });

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) {
      setMessage('Error: No files selected.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const { uploaded, replaced, errors, sizeHint, zipExtracted, cancelled } = await uploadFiles(files);

      if (cancelled) {
        setMessage('Upload cancelled.');
        return;
      }

      if (uploaded.length > 0 || replaced.length > 0) {
        let msg = uploadBatchSuccessMessage({
          uploaded,
          replaced,
          zipExtracted,
          archiveName: zipExtracted ? uploaded[0] : undefined,
          sizeHint,
        });
        if (errors.length > 0) {
          msg += ` Some files were skipped: ${errors.join('; ')}`;
        }
        setMessage(msg);
        onUploadComplete?.();
        window.dispatchEvent(new CustomEvent('project-files-uploaded'));
      }

      if (errors.length > 0 && uploaded.length === 0 && replaced.length === 0) {
        setMessage(`Error: ${errors[0]}`);
      }
    } catch {
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadFiles, onUploadComplete]);

  const uploadPastedText = useCallback(async () => {
    if (!pasteText.trim() || !pasteMode) return;
    setUploading(true);
    setMessage('');
    notifyUploadStart([{ name: `Pasted ${pasteMode.replace('_', ' ')}` }]);

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('pasted_text', pasteText);
    formData.append('pasted_type', pasteMode);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        redirect: 'manual',
      });
      const contentType = res.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : {};
      if (!res.ok || data.error) {
        setMessage(`Error: ${formatUploadApiError(res.status, data)}`);
      } else {
        setMessage(pastedContentSuccessMessage());
        setPasteText('');
        setPasteMode(null);
        onUploadComplete?.();
        if (data.data?.id) {
          kickFileProcessing(data.data.id);
        }
      }
    } catch {
      setMessage('Upload failed');
    } finally {
      notifyUploadEnd();
      setUploading(false);
    }
  }, [projectId, pasteText, pasteMode, onUploadComplete]);

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setDragging(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    void handleFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  return (
    <div className="space-y-6">
      {collisionDialog}
      <Card>
        <CardHeader
          title="Upload Center"
          description="Files upload to this project workspace only. Open the project first, then upload or capture."
        />

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'rounded-xl border-2 border-dashed p-4 text-center transition-colors sm:p-8',
            uploading
              ? 'border-[var(--brand-accent)]/40 bg-[rgba(37,99,235,0.04)] dark:bg-[rgba(37,99,235,0.08)]'
              : dragging
                ? 'border-gray-400 bg-gray-50 dark:bg-[var(--ud-cloud)]/40'
                : 'border-gray-200 dark:border-[var(--ud-cloud)]'
          )}
        >
          {uploadProgress ? (
            <div className="py-2">
              <UploadingFilesIndicator
                count={uploadProgress.count}
                names={uploadProgress.names}
                variant="banner"
                className="border-0 bg-transparent px-0 py-0 dark:bg-transparent"
              />
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Drag and drop files here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {UPLOAD_ACCEPTED_TYPES_HINT}. {UPLOAD_MAX_SIZE_HINT}. {UPLOAD_BACKGROUND_NOTE}
              </p>
              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                  accept={UPLOAD_ACCEPT}
                />
                <span className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors bg-white text-gray-700 dark:text-gray-300 border border-gray-200 hover:bg-gray-50 shadow-sm px-3 py-1.5 text-xs dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:hover:bg-[var(--ud-cloud)]/40">
                  Browse files
                </span>
              </label>
            </>
          )}
        </div>

        {message && (
          <p className={cn('text-sm mt-3', message.startsWith('Error') ? 'text-red-600' : 'text-emerald-600')}>
            {message}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Paste Content" description="Paste emails, meeting notes, or transcripts" />

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <PasteButton icon={Mail} label="Email" active={pasteMode === 'email'} onClick={() => setPasteMode('email')} />
          <PasteButton icon={StickyNote} label="Meeting Notes" active={pasteMode === 'meeting'} onClick={() => setPasteMode('meeting')} />
          <PasteButton icon={Mic} label="Transcript" active={pasteMode === 'transcript'} onClick={() => setPasteMode('transcript')} />
          <PasteButton icon={FileText} label="Note" active={pasteMode === 'note'} onClick={() => setPasteMode('note')} />
        </div>

        {pasteMode && (
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Paste your ${pasteMode.replace('_', ' ')} content here...`}
              className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={uploadPastedText} loading={isUploading} disabled={!pasteText.trim()}>
                Upload to Sunny
              </Button>
              <Button variant="ghost" onClick={() => { setPasteMode(null); setPasteText(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PasteButton({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-colors sm:gap-1.5 sm:p-3 sm:text-sm',
        active ? 'border-gray-900 bg-gray-50 text-gray-900 dark:text-gray-100' : 'border-gray-200 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
