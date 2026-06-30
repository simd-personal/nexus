'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadNameCollisionDialog } from '@/components/project/UploadNameCollisionDialog';
import {
  uploadProjectFilesWithCollisions,
  type ProjectFileSummary,
  type UploadCollisionChoice,
  type UploadCollisionPrompt,
} from '@/lib/upload/collisions';
import { notifyUploadEnd, notifyUploadStart } from '@/lib/upload/progress-events';

type UploadBatchResult = Awaited<ReturnType<typeof uploadProjectFilesWithCollisions>>;

export function useProjectFileUpload(
  projectId: string,
  options?: { existingFiles?: ProjectFileSummary[] }
) {
  const [collision, setCollision] = useState<UploadCollisionPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((choice: UploadCollisionChoice) => void) | null>(null);

  const promptCollision = useCallback((info: UploadCollisionPrompt) => {
    return new Promise<UploadCollisionChoice>((resolve) => {
      setCollision(info);
      resolverRef.current = resolve;
    });
  }, []);

  const resolveCollision = useCallback((choice: UploadCollisionChoice) => {
    resolverRef.current?.(choice);
    resolverRef.current = null;
    setCollision(null);
  }, []);

  const uploadFiles = useCallback(
    async (files: File[], uploadOptions?: { userNote?: string }): Promise<UploadBatchResult> => {
      if (!files.length) {
        return {
          uploaded: [],
          replaced: [],
          fileIds: [],
          errors: ['No files selected.'],
          sizeHint: null,
          zipExtracted: false,
          cancelled: false,
        };
      }

      setBusy(true);
      notifyUploadStart(files);
      try {
        return await uploadProjectFilesWithCollisions(projectId, files, {
          existingFiles: options?.existingFiles,
          userNote: uploadOptions?.userNote,
          promptCollision,
        });
      } finally {
        notifyUploadEnd();
        setBusy(false);
      }
    },
    [projectId, options?.existingFiles, promptCollision]
  );

  const collisionDialog = collision ? (
    <UploadNameCollisionDialog
      collision={collision}
      busy={busy}
      onReplace={() => resolveCollision('replace')}
      onAddCopy={() => resolveCollision('add')}
      onCancel={() => resolveCollision('cancel')}
    />
  ) : null;

  return { uploadFiles, collisionDialog, busy };
}
