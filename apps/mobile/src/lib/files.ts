import type { ProjectFile } from '@/lib/types';

export function normalizeUploadFileName(fileName: string): string {
  return fileName.trim().toLowerCase();
}

export function findFileByUploadName(
  files: ProjectFile[],
  uploadName: string
): ProjectFile | null {
  const normalized = normalizeUploadFileName(uploadName);
  return files.find((file) => normalizeUploadFileName(file.file_name) === normalized) ?? null;
}

export function fileStatusLabel(status: string): string {
  if (status === 'processed' || status === 'complete' || status === 'ready') return 'Ready';
  if (status === 'failed') return 'Failed';
  if (status === 'processing' || status === 'pending') return 'Processing';
  if (status === 'uploaded_unprocessed') return 'Needs processing';
  return status;
}

export function fileStatusTone(
  status: string
): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'processed' || status === 'complete' || status === 'ready') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'processing' || status === 'pending' || status === 'uploaded_unprocessed') {
    return 'warning';
  }
  return 'default';
}

export function isFileProcessing(status: string): boolean {
  return status === 'processing' || status === 'pending';
}
