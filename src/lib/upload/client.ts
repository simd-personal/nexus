import {
  maxUploadSizeTier,
  uploadSizeHint,
} from '@/lib/upload/size-hints';
import {
  formatMaxUploadSize,
  maxBytesForUploadKind,
  validateUploadByteSize,
} from '@/lib/upload/limits';

export function isFileDragEvent(event: DragEvent | React.DragEvent): boolean {
  const dataTransfer = 'dataTransfer' in event ? event.dataTransfer : null;
  if (!dataTransfer) return false;

  return Array.from(dataTransfer.types).some(
    (type) => type === 'Files' || type === 'application/x-moz-file'
  );
}

export function getFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  if (dataTransfer.files?.length > 0) {
    return Array.from(dataTransfer.files);
  }

  const files: File[] = [];
  if (dataTransfer.items) {
    for (const item of Array.from(dataTransfer.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }

  return files;
}

export function sanitizeUploadFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() || 'upload';
  return base.replace(/[^\w.\-()+\s]/g, '_') || 'upload';
}

/** Client-side guard before hitting /api/upload (server enforces the same limits). */
export function validateClientUploadFile(file: File): { ok: true } | { ok: false; error: string } {
  const kind = file.name.toLowerCase().endsWith('.zip') ? 'zip' : 'file';
  return validateUploadByteSize(file.size, kind);
}

export const MAX_UPLOAD_SIZE_LABEL = formatMaxUploadSize('file');
export const MAX_CLIENT_UPLOAD_BYTES = maxBytesForUploadKind('file');

async function parseUploadResponse(res: Response): Promise<{
  error?: string;
  data?: unknown;
  zip_extracted?: boolean;
  skipped?: string[];
}> {
  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return res.json();
  }

  if (res.status === 401) {
    return { error: 'Please sign in again to upload files.' };
  }

  if (res.redirected || res.status === 307 || res.status === 302) {
    return { error: 'Session expired. Please sign in again.' };
  }

  return { error: `Upload failed (${res.status})` };
}

export interface UploadFileResult {
  ok: boolean;
  fileId?: string;
  fileIds?: string[];
  error?: string;
  sizeHint?: string | null;
  zipExtracted?: boolean;
  skipped?: string[];
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  options?: { userNote?: string }
): Promise<UploadFileResult> {
  const sizeGuard = validateClientUploadFile(file);
  if (!sizeGuard.ok) {
    return { ok: false, error: sizeGuard.error };
  }

  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append('file', file, sanitizeUploadFileName(file.name));
  if (options?.userNote?.trim()) {
    formData.append('user_note', options.userNote.trim());
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
    redirect: 'manual',
  });

  const data = await parseUploadResponse(res);

  if (data.error || !res.ok) {
    return { ok: false, error: data.error ?? 'Upload failed' };
  }

  if (data.zip_extracted && Array.isArray(data.data)) {
    const records = data.data as Array<{ id: string }>;
    const fileIds = records.map((r) => r.id).filter(Boolean);
    return {
      ok: true,
      fileIds,
      fileId: fileIds[0],
      zipExtracted: true,
      skipped: data.skipped,
      sizeHint: getClientUploadSizeHint([file]),
    };
  }

  const fileId = (data as { data?: { id?: string } }).data?.id;
  return {
    ok: true,
    fileId,
    fileIds: fileId ? [fileId] : [],
    sizeHint: getClientUploadSizeHint([file]),
  };
}

/** Start durable server-side processing (runs in a long-lived /process request). */
export function kickFileProcessing(fileId: string, force = false): void {
  const query = force ? '?force=1' : '';
  void fetch(`/api/files/${fileId}/process${query}`, { method: 'POST' });
}

export async function uploadProjectFiles(
  projectId: string,
  files: File[],
  options?: { userNote?: string }
): Promise<{
  uploaded: string[];
  fileIds: string[];
  errors: string[];
  sizeHint: string | null;
  zipExtracted: boolean;
}> {
  const uploaded: string[] = [];
  const fileIds: string[] = [];
  const errors: string[] = [];
  let zipExtracted = false;

  for (const file of files) {
    const result = await uploadProjectFile(projectId, file, options);
    if (result.ok) {
      uploaded.push(file.name);
      if (result.fileIds?.length) {
        fileIds.push(...result.fileIds);
        for (const id of result.fileIds) kickFileProcessing(id);
      } else if (result.fileId) {
        fileIds.push(result.fileId);
        kickFileProcessing(result.fileId);
      }
      if (result.zipExtracted) zipExtracted = true;
    } else {
      errors.push(`${file.name}: ${result.error ?? 'Upload failed'}`);
    }
  }

  const sizeHint = getClientUploadSizeHint(files);

  return { uploaded, fileIds, errors, sizeHint, zipExtracted };
}

export function getClientUploadSizeHint(files: File[]): string | null {
  const tier = maxUploadSizeTier(files.map((f) => f.size));
  return uploadSizeHint(tier);
}

/** Extensions shown in the upload UI — drops accept any file type. */
export const UPLOAD_ACCEPT =
  '.txt,.md,.markdown,.pdf,.docx,.csv,.png,.jpg,.jpeg,.webp,.heic,.heif,.vtt,.srt,.mp3,.m4a,.wav,.eml,.zip';

export const PHOTO_CAPTURE_ACCEPT = 'image/*';
