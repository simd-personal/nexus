'use client';

import { PhotoCaptureUpload, isImageFileName } from '@/components/project/PhotoCaptureUpload';
import { EmailForwardCard } from '@/components/project/EmailForwardCard';
import { FileActionsMenu } from '@/components/project/FileActionsMenu';
import { FileUploadCenter } from '@/components/project/FileUpload';
import { FileViewerModal } from '@/components/project/FileViewerModal';
import { FileProcessingProgress } from '@/components/project/FileProcessingProgress';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SOURCE_TYPE_LABELS, isProcessable } from '@/lib/constants';
import { needsProcessingKick } from '@/lib/processing/progress';
import { kickFileProcessing } from '@/lib/upload/client';
import type { FileRecord, SourceType } from '@/types/database';
import { formatRelativeTime } from '@/lib/utils';
import { Eye, FileText, Image as ImageIcon, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';

export function ProjectFilesClient({ projectId, initialFiles }: {
  projectId: string;
  initialFiles: FileRecord[];
}) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [viewingFile, setViewingFile] = useState<FileRecord | null>(null);
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
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

  async function handleDelete(file: FileRecord) {
    const confirmed = window.confirm(`Delete "${file.file_name}"? This removes the file and its indexed content.`);
    if (!confirmed) return;

    setBusyFileId(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? 'Failed to delete file');
        return;
      }
      if (viewingFile?.id === file.id) setViewingFile(null);
      await fetchFiles();
      router.refresh();
    } finally {
      setBusyFileId(null);
    }
  }

  async function handleReprocess(file: FileRecord) {
    setBusyFileId(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}/reprocess`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? 'Failed to reprocess file');
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
    return (
      <StatusBadge status={
        file.status === 'processed' ? 'healthy' :
        file.status === 'processing' || file.status === 'pending' ? 'watch' :
        file.status === 'failed' ? 'critical' :
        file.status === 'uploaded_unprocessed' && isProcessable(file.file_name) ? 'watch' :
        'needs_review'
      } />
    );
  }

  return (
    <div className="space-y-6">
      <EmailForwardCard projectId={projectId} />
      <PhotoCaptureUpload
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
        onMessage={setUploadMessage}
      />
      <FileUploadCenter projectId={projectId} onUploadComplete={handleUploadComplete} />
      {uploadMessage && (
        <p className={`rounded-lg px-1 text-sm ${uploadMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
          {uploadMessage}
        </p>
      )}

      {viewingFile && (
        <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Uploaded Files</h2>
        {files.length === 0 ? (
          <Card className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No files uploaded yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} padding={true} className="overflow-hidden">
                <div className="space-y-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setViewingFile(file)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left hover:opacity-80"
                    >
                      {isImageFileName(file.file_name) ? (
                        <ImageIcon className="h-5 w-5 shrink-0 text-violet-500" />
                      ) : (
                        <FileText className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{file.file_name}</p>
                          <span className="sm:hidden">{fileStatusBadge(file)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {SOURCE_TYPE_LABELS[file.source_type as SourceType] ?? file.source_type}
                          {' · '}
                          {formatRelativeTime(file.created_at)}
                          {file.origin_file_id ? ' · Shared copy' : ''}
                        </p>
                        {file.user_note && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{file.user_note}</p>
                        )}
                      </div>
                    </button>
                    {file.status === 'processing' && (
                      <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-[var(--ud-cloud)] sm:border-0 sm:pt-0">
                    <FileActionsMenu
                      file={file}
                      currentProjectId={projectId}
                      busy={busyFileId === file.id}
                      onUpdated={async () => {
                        await fetchFiles();
                        router.refresh();
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewingFile(file)}
                      aria-label={`View ${file.file_name}`}
                      className="shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    {canReprocess(file.status) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyFileId === file.id}
                        onClick={() => handleReprocess(file)}
                        aria-label={`Reprocess ${file.file_name}`}
                        className="shrink-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${busyFileId === file.id ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Reprocess</span>
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyFileId === file.id}
                      onClick={() => handleDelete(file)}
                      aria-label={`Delete ${file.file_name}`}
                      className="shrink-0 text-red-600 hover:border-red-200 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                    <span className="hidden sm:inline">{fileStatusBadge(file)}</span>
                  </div>

                  {(file.status === 'processing' || file.status === 'pending') && (
                    <FileProcessingProgress file={file} />
                  )}
                  {file.status === 'uploaded_unprocessed' && isProcessable(file.file_name) && (
                    <p className="text-xs text-amber-700">
                      Not indexed for search yet. Open View to read the spreadsheet, or tap Reprocess to index it.
                    </p>
                  )}
                  {file.status === 'uploaded_unprocessed' && !isProcessable(file.file_name) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">This file type is stored but cannot be processed.</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
