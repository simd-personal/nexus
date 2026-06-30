import { sanitizeUploadFileName } from '@/lib/upload/client';

export type ProjectFileSummary = { id: string; file_name: string };

export function normalizeUploadFileName(fileName: string): string {
  return sanitizeUploadFileName(fileName).toLowerCase();
}

export function findProjectFileByUploadName(
  files: ProjectFileSummary[],
  uploadName: string
): ProjectFileSummary | null {
  const normalized = normalizeUploadFileName(uploadName);
  return files.find((file) => normalizeUploadFileName(file.file_name) === normalized) ?? null;
}
