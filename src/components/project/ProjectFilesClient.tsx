'use client';

import { FileActionsMenu } from '@/components/project/FileActionsMenu';
import { FileProcessingProgress } from '@/components/project/FileProcessingProgress';
import { FileViewerModal } from '@/components/project/FileViewerModal';
import { isImageFileName } from '@/components/project/PhotoCaptureUpload';
import { ProjectUploadSection } from '@/components/project/ProjectUploadSection';
import { UploadingFilesIndicator } from '@/components/project/UploadingFilesIndicator';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { SOURCE_TYPE_LABELS, isProcessable } from '@/lib/constants';
import { needsProcessingKick } from '@/lib/processing/progress';
import { fileStatusLabel } from '@/lib/processing/user-messages';
import { kickFileProcessing } from '@/lib/upload/client';
import {
  UPLOAD_PROGRESS_END,
  UPLOAD_PROGRESS_START,
  type UploadProgressDetail,
} from '@/lib/upload/progress-events';
import type { FileRecord, SourceType } from '@/types/database';
import { formatRelativeTime } from '@/lib/utils';
import { Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';

export function ProjectFilesClient({ projectId, initialFiles }: {
  projectId: string;
  initialFiles: FileRecord[];
}) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [viewingFile, setViewingFile] = useState<FileRecord | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [pendingUpload, setPendingUpload] = useState<UploadProgressDetail | null>(null);
  const kickingRef = useRef(new Set<string>());
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedFileId = searchParams.get('file');

  const kickProcessing = useCallback((file: FileRecord, force = false) => {
    if (kickingRef.current.has(file.id)) return;
    kickingRef.current.add(file.id);
    kickFileProcessing(file.id, force);
    window.setTimeout(() => kickingRef.current.delete(file.id), 15_000);
  }, []);

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    if (res.ok) {
      const data = await res.json();
      const nextFiles: FileRecord[] = data.files ?? [];
      setFiles(nextFiles);

      for (const file of nextFiles) {
        if (needsProcessingKick(file)) {
          kickProcessing(file);
        }
      }
    }
  }, [projectId, kickProcessing]);

  const hasActiveProcessing = files.some(
    (file) => file.status === 'processing' || file.status === 'pending'
  );

  useEffect(() => {
    const intervalMs = hasActiveProcessing ? 2000 : 8000;
    const interval = setInterval(fetchFiles, intervalMs);
    return () => clearInterval(interval);
  }, [fetchFiles, hasActiveProcessing]);

  useEffect(() => {
    function onUploadStart(event: Event) {
      setPendingUpload((event as CustomEvent<UploadProgressDetail>).detail);
    }

    async function onUploadEnd() {
      await fetchFiles();
      setPendingUpload(null);
    }

    window.addEventListener(UPLOAD_PROGRESS_START, onUploadStart);
    window.addEventListener(UPLOAD_PROGRESS_END, onUploadEnd);
    return () => {
      window.removeEventListener(UPLOAD_PROGRESS_START, onUploadStart);
      window.removeEventListener(UPLOAD_PROGRESS_END, onUploadEnd);
    };
  }, [fetchFiles]);

  useEffect(() => {
    function onUploaded() {
      fetchFiles();
      router.refresh();
    }
    window.addEventListener('project-files-uploaded', onUploaded);
    return () => window.removeEventListener('project-files-uploaded', onUploaded);
  }, [fetchFiles, router]);

  useEffect(() => {
    if (!highlightedFileId) return;
    const match = files.find((file) => file.id === highlightedFileId);
    if (match) {
      setViewingFile(match);
    }
  }, [files, highlightedFileId]);

  function handleUploadComplete() {
    fetchFiles();
    router.refresh();
  }

  function openDeleteDialog(file: FileRecord) {
    setDeleteError('');
    setFileToDelete(file);
  }

  function closeDeleteDialog() {
    if (busyFileId) return;
    setFileToDelete(null);
    setDeleteError('');
  }

  async function confirmDelete() {
    if (!fileToDelete) return;

    setBusyFileId(fileToDelete.id);
    setDeleteError('');
    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? 'Failed to delete file');
        return;
      }
      if (viewingFile?.id === fileToDelete.id) setViewingFile(null);
      setFileToDelete(null);
      await fetchFiles();
      router.refresh();
    } finally {
      setBusyFileId(null);
    }
  }

  async function handleReprocess(file: FileRecord) {
    setBusyFileId(file.id);
    setActionError('');
    try {
      const res = await fetch(`/api/files/${file.id}/reprocess`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error ?? 'Failed to reprocess file');
        return;
      }
      kickProcessing(file, true);
      await fetchFiles();
      router.refresh();
    } finally {
      setBusyFileId(null);
    }
  }

  const canReprocess = (status: FileRecord['status']) =>
    status === 'uploaded_unprocessed' || status === 'failed' || status === 'processed';

  function fileStatusBadge(file: FileRecord) {
    const tone =
      file.status === 'processed' ? 'healthy' :
      file.status === 'processing' || file.status === 'pending' ? 'watch' :
      file.status === 'failed' ? 'critical' :
      file.status === 'uploaded_unprocessed' && isProcessable(file.file_name) ? 'watch' :
      'needs_review';

    return (
      <StatusBadge
        status={tone}
        label={fileStatusLabel(file.status)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProjectUploadSection
        projectId={projectId}
        fileCount={files.length}
        existingFiles={files.map((file) => ({ id: file.id, file_name: file.file_name }))}
        onUploadComplete={handleUploadComplete}
        onMessage={setUploadMessage}
        uploadMessage={uploadMessage}
      />

      {viewingFile && (
        <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      <ConfirmDialog
        open={Boolean(fileToDelete)}
        title="Delete file?"
        description={
          fileToDelete
            ? `"${fileToDelete.file_name}" will be removed from this project along with its indexed content. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete file"
        cancelLabel="Cancel"
        loading={Boolean(fileToDelete && busyFileId === fileToDelete.id)}
        error={deleteError}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />

      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {actionError}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Uploaded Files</h2>
        {files.length === 0 && !pendingUpload ? (
          <Card className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No files uploaded yet</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--ud-mist)] bg-white shadow-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
            <ul className="divide-y divide-gray-100 dark:divide-[var(--ud-cloud)]">
              {pendingUpload?.names.map((name, index) => (
                <li key={`pending-${index}-${name}`}>
                  <UploadingFilesIndicator count={1} names={[name]} variant="row" />
                </li>
              ))}
              {files.map((file) => (
                <li key={file.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setViewingFile(file)}
                      className="mt-0.5 shrink-0 hover:opacity-80"
                      aria-label={`View ${file.file_name}`}
                    >
                      {isImageFileName(file.file_name) ? (
                        <ImageIcon className="h-4 w-4 text-violet-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingFile(file)}
                          className="min-w-0 flex-1 text-left hover:opacity-80"
                        >
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.file_name}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {SOURCE_TYPE_LABELS[file.source_type as SourceType] ?? file.source_type}
                            {' · '}
                            {formatRelativeTime(file.created_at)}
                            {file.origin_file_id ? ' · Shared copy' : ''}
                          </p>
                        </button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                          onClick={() => setViewingFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <span className="hidden shrink-0 sm:inline-flex">{fileStatusBadge(file)}</span>
                        <FileActionsMenu
                          file={file}
                          currentProjectId={projectId}
                          busy={busyFileId === file.id}
                          iconOnly
                          canReprocess={canReprocess(file.status)}
                          onReprocess={() => handleReprocess(file)}
                          onDelete={() => openDeleteDialog(file)}
                          onUpdated={async () => {
                            await fetchFiles();
                            router.refresh();
                          }}
                          onError={setActionError}
                        />
                      </div>

                      {file.user_note && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-600 dark:text-gray-300">
                          {file.user_note}
                        </p>
                      )}

                      {(file.status === 'processing' ||
                        file.status === 'pending' ||
                        file.status === 'failed') && (
                        <FileProcessingProgress file={file} compact />
                      )}

                      {file.status === 'uploaded_unprocessed' && isProcessable(file.file_name) && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          Not indexed yet — reprocess to enable search.
                        </p>
                      )}
                      {file.status === 'uploaded_unprocessed' && !isProcessable(file.file_name) && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Stored only — this file type cannot be indexed.
                        </p>
                      )}

                      <span className="mt-1 inline-flex sm:hidden">{fileStatusBadge(file)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
