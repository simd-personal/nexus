'use client';

import {
  getFilesFromDataTransfer,
  isFileDragEvent,
  uploadProjectFiles,
} from '@/lib/upload/client';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export function ProjectDropZone({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dragDepth = useRef(0);
  const uploadingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 5000);
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        showToast('No files detected in drop. Try again or use Browse files.');
        return;
      }

      if (uploadingRef.current) return;

      uploadingRef.current = true;
      try {
        const { uploaded, errors } = await uploadProjectFiles(projectId, files);

        if (uploaded.length > 0) {
          showToast(
            uploaded.length === 1
              ? `${uploaded[0]} uploaded. Sunny is processing…`
              : `${uploaded.length} files uploaded. Sunny is processing…`
          );
          router.refresh();
          window.dispatchEvent(new CustomEvent('project-files-uploaded'));
        }

        if (errors.length > 0) {
          showToast(errors[0]);
        }
      } catch {
        showToast('Upload failed. Please try again.');
      } finally {
        uploadingRef.current = false;
        dragDepth.current = 0;
        setDragging(false);
      }
    },
    [projectId, router, showToast]
  );

  useEffect(() => {
    function onDragEnter(event: DragEvent) {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    }

    function onDragOver(event: DragEvent) {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }

    function onDragLeave(event: DragEvent) {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setDragging(false);
      }
    }

    function onDrop(event: DragEvent) {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepth.current = 0;
      setDragging(false);

      const files = getFilesFromDataTransfer(event.dataTransfer!);
      void handleFiles(files);
    }

    window.addEventListener('dragenter', onDragEnter, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('dragleave', onDragLeave, true);
    window.addEventListener('drop', onDrop, true);

    return () => {
      window.removeEventListener('dragenter', onDragEnter, true);
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('dragleave', onDragLeave, true);
      window.removeEventListener('drop', onDrop, true);
    };
  }, [handleFiles]);

  return (
    <>
      {children}

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-8 backdrop-blur-sm">
          <div className="flex max-w-lg flex-col items-center rounded-2xl border-2 border-dashed border-white/80 bg-white/95 px-10 py-12 text-center shadow-2xl">
            <Upload className="mb-4 h-10 w-10 text-gray-700 dark:text-gray-300" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Drop files to upload</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              PDF, Markdown, images, transcripts, audio, and more
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
