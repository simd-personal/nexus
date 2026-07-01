import JSZip from 'jszip';
import { getFileExtension, isProcessable } from '@/lib/constants';
import { sanitizeUploadFileName } from '@/lib/upload/client';

export const ZIP_MAX_ENTRIES = 75;
export const ZIP_MAX_UNCOMPRESSED_BYTES = 400 * 1024 * 1024; // 400 MB
export const ZIP_MAX_ENTRY_BYTES = 200 * 1024 * 1024; // 200 MB per file

export interface ZipExtractedEntry {
  name: string;
  buffer: Buffer;
}

export interface ZipExtractResult {
  entries: ZipExtractedEntry[];
  skipped: string[];
}

const SKIP_PREFIXES = ['__MACOSX/', '.'];
const SKIP_NAMES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini']);

export function isZipFile(fileName: string, mimeType?: string | null): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.zip')) return true;
  const mime = mimeType?.toLowerCase() ?? '';
  return mime === 'application/zip' || mime === 'application/x-zip-compressed';
}

function shouldSkipEntry(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  const base = normalized.split('/').pop()?.toLowerCase() ?? '';
  if (!base || base.startsWith('.')) return true;
  if (SKIP_NAMES.has(base)) return true;
  if (SKIP_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;
  if (normalized.endsWith('/')) return true;
  return false;
}

function mimeForExtension(ext: string): string {
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.csv':
      return 'text/csv';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.mp3':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}

export function guessMimeType(fileName: string): string {
  return mimeForExtension(getFileExtension(fileName));
}

/**
 * Expand a zip archive into individual uploadable files. Non-processable or
 * oversized entries are listed in `skipped` with a short reason.
 */
export async function extractZipArchive(buffer: Buffer): Promise<ZipExtractResult> {
  const zip = await JSZip.loadAsync(buffer);
  const entries: ZipExtractedEntry[] = [];
  const skipped: string[] = [];
  let totalBytes = 0;

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || shouldSkipEntry(path)) continue;

    const fileName = sanitizeUploadFileName(path.split('/').pop() || path);
    if (!isProcessable(fileName)) {
      skipped.push(`${fileName} (unsupported type)`);
      continue;
    }

    if (entries.length >= ZIP_MAX_ENTRIES) {
      skipped.push(`${fileName} (archive limit: ${ZIP_MAX_ENTRIES} files)`);
      continue;
    }

    const data = await entry.async('nodebuffer');
    if (data.length > ZIP_MAX_ENTRY_BYTES) {
      skipped.push(`${fileName} (over ${Math.round(ZIP_MAX_ENTRY_BYTES / (1024 * 1024))} MB)`);
      continue;
    }

    if (totalBytes + data.length > ZIP_MAX_UNCOMPRESSED_BYTES) {
      skipped.push(`${fileName} (archive total size limit reached)`);
      continue;
    }

    totalBytes += data.length;
    entries.push({ name: fileName, buffer: data });
  }

  return { entries, skipped };
}
