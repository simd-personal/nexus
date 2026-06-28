'use client';

import { FileUploadCenter } from '@/components/project/FileUpload';
import { FileViewerModal } from '@/components/project/FileViewerModal';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SOURCE_TYPE_LABELS } from '@/lib/constants';
import type { FileRecord, SourceType } from '@/types/database';
import { formatRelativeTime } from '@/lib/utils';
import { Eye, FileText, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export function ProjectFilesClient({ projectId, initialFiles }: {
  projectId: string;
  initialFiles: FileRecord[];
}) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [viewingFile, setViewingFile] = useState<FileRecord | null>(null);
  const router = useRouter();

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files ?? []);
    }
  }, [projectId]);

  useEffect(() => {
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, [fetchFiles]);

  function handleUploadComplete() {
    fetchFiles();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <FileUploadCenter projectId={projectId} onUploadComplete={handleUploadComplete} />

      {viewingFile && (
        <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h2>
        {files.length === 0 ? (
          <Card className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No files uploaded yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} padding={true}>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewingFile(file)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80"
                  >
                    <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {SOURCE_TYPE_LABELS[file.source_type as SourceType] ?? file.source_type}
                        {' · '}
                        {formatRelativeTime(file.created_at)}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewingFile(file)}
                      aria-label={`View ${file.file_name}`}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    {file.status === 'processing' && (
                      <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                    )}
                    <StatusBadge status={
                      file.status === 'processed' ? 'healthy' :
                      file.status === 'processing' ? 'watch' :
                      file.status === 'failed' ? 'critical' :
                      'needs_review'
                    } />
                  </div>
                </div>
                {file.status === 'uploaded_unprocessed' && (
                  <p className="text-xs text-gray-500 mt-2">Uploaded but not processed (unsupported format)</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
