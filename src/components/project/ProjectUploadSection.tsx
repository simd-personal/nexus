'use client';

import { useState } from 'react';
import { ChevronUp, Plus } from 'lucide-react';
import { EmailForwardCard } from '@/components/project/EmailForwardCard';
import { PhotoCaptureUpload } from '@/components/project/PhotoCaptureUpload';
import { FileUploadCenter } from '@/components/project/FileUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type ProjectUploadSectionProps = {
  projectId: string;
  fileCount: number;
  existingFiles?: Array<{ id: string; file_name: string }>;
  onUploadComplete: () => void;
  onMessage: (message: string) => void;
  uploadMessage?: string;
};

export function ProjectUploadSection({
  projectId,
  fileCount,
  existingFiles,
  onUploadComplete,
  onMessage,
  uploadMessage,
}: ProjectUploadSectionProps) {
  const [uploadExpanded, setUploadExpanded] = useState(fileCount === 0);
  const showUploadSection = fileCount === 0 || uploadExpanded;

  if (!showUploadSection && fileCount > 0) {
    return (
      <Card padding className="flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {fileCount} file{fileCount !== 1 ? 's' : ''} in this project
        </p>
        <Button variant="secondary" size="sm" onClick={() => setUploadExpanded(true)}>
          <Plus className="h-4 w-4" />
          Add files
        </Button>
        {uploadMessage && (
          <p
            className={`w-full text-sm ${uploadMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}
          >
            {uploadMessage}
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {fileCount > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Add more files to this project</p>
          <Button variant="ghost" size="sm" onClick={() => setUploadExpanded(false)}>
            <ChevronUp className="h-4 w-4" />
            Collapse
          </Button>
        </div>
      )}
      <EmailForwardCard projectId={projectId} />
      <PhotoCaptureUpload
        projectId={projectId}
        onUploadComplete={onUploadComplete}
        onMessage={onMessage}
      />
      <FileUploadCenter
        projectId={projectId}
        existingFiles={existingFiles}
        onUploadComplete={onUploadComplete}
      />
      {uploadMessage && (
        <p
          className={`rounded-lg px-1 text-sm ${uploadMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}
        >
          {uploadMessage}
        </p>
      )}
    </div>
  );
}
