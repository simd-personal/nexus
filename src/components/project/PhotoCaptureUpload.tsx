'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { PHOTO_CAPTURE_ACCEPT, uploadProjectFile, kickFileProcessing } from '@/lib/upload/client';

type PhotoCaptureUploadProps = {
  projectId: string;
  onUploadComplete?: () => void;
  onMessage?: (message: string) => void;
};

export function PhotoCaptureUpload({ projectId, onUploadComplete, onMessage }: PhotoCaptureUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  function openPreview(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setNote('');
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setNote('');
  }

  async function savePhoto() {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const result = await uploadProjectFile(projectId, pendingFile, {
        userNote: note.trim() || undefined,
      });
      if (!result.ok) {
        onMessage?.(`Error: ${result.error ?? 'Upload failed'}`);
        return;
      }
      if (result.fileId) kickFileProcessing(result.fileId);
      onMessage?.(`${pendingFile.name} saved to this project. Sunny is processing...`);
      clearPreview();
      onUploadComplete?.();
      window.dispatchEvent(new CustomEvent('project-files-uploaded'));
    } catch {
      onMessage?.('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Photos"
        description="Capture or upload pictures for this project only. Sunny never guesses which project a photo belongs to."
      />
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer">
          <input
            ref={cameraInputRef}
            type="file"
            accept={PHOTO_CAPTURE_ACCEPT}
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) openPreview(file);
              event.target.value = '';
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Camera className="h-4 w-4" />
            Take Photo
          </span>
        </label>
        <label className="inline-flex cursor-pointer">
          <input
            ref={galleryInputRef}
            type="file"
            accept={PHOTO_CAPTURE_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) openPreview(file);
              event.target.value = '';
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Upload Photo
          </span>
        </label>
      </div>

      {pendingFile && previewUrl && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">Review before saving to this project</p>
            <button
              type="button"
              onClick={clearPreview}
              className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-700"
              aria-label="Cancel photo upload"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <img
            src={previewUrl}
            alt="Photo preview"
            className="mt-3 max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
          />
          <label className="mt-4 block text-xs font-medium text-gray-600">
            Optional note or context
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What is this photo about? Who was in the meeting? What should Sunny remember?"
              className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              rows={3}
            />
          </label>
          <div className="mt-3 flex gap-2">
            <Button onClick={savePhoto} loading={uploading}>
              Save to project
            </Button>
            <Button variant="ghost" onClick={clearPreview} disabled={uploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function isImageFileName(fileName: string): boolean {
  return /\.(png|jpe?g|webp|heic|heif|gif)$/i.test(fileName);
}
