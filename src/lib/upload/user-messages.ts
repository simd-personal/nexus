import { formatMaxUploadSize } from '@/lib/upload/limits';
import { uploadSizeHint } from '@/lib/upload/size-hints';
import type { UploadSizeTier } from '@/lib/upload/size-hints';

export const UPLOAD_ACCEPTED_TYPES_HINT =
  'PDF, DOCX, TXT, email, transcript, image, audio, spreadsheets, and zip archives';

export const UPLOAD_MAX_SIZE_HINT = `Max ${formatMaxUploadSize('file')} per file`;

export const UPLOAD_BACKGROUND_NOTE =
  'Sunny processes uploads in the background. You can keep working while files are indexed.';

export function uploadSuccessMessage(options: {
  count: number;
  zipExtracted?: boolean;
  archiveName?: string;
  sizeHint?: string | null;
}): string {
  const { count, zipExtracted, archiveName, sizeHint } = options;
  let msg: string;

  if (zipExtracted && archiveName) {
    msg = `Extracted ${count} file${count === 1 ? '' : 's'} from ${archiveName}. Sunny is processing in the background.`;
  } else if (count === 1) {
    msg = 'File uploaded. Sunny is processing in the background.';
  } else {
    msg = `${count} files uploaded. Sunny is processing in the background.`;
  }

  if (sizeHint) msg += ` ${sizeHint}`;
  return msg;
}

export function pastedContentSuccessMessage(): string {
  return 'Content saved. Sunny is indexing it in the background.';
}

export function formatUploadApiError(
  status: number,
  body: { error?: string; retry_after?: number; cooldown?: boolean } = {}
): string {
  if (body.error) {
    if (body.cooldown && body.retry_after) {
      const minutes = Math.ceil(body.retry_after / 60);
      const wait = minutes <= 1 ? 'about a minute' : `about ${minutes} minutes`;
      return `${body.error} (Try again in ${wait}.)`;
    }
    return body.error;
  }

  if (status === 413) {
    return `File is too large. ${UPLOAD_MAX_SIZE_HINT}.`;
  }
  if (status === 429) {
    return 'Upload limit reached for now. Please wait a few minutes and try again.';
  }
  if (status === 401) {
    return 'Please sign in again to upload files.';
  }
  return `Upload failed (${status}). Please try again.`;
}

export function clientUploadSizeHint(tier: UploadSizeTier): string | null {
  return uploadSizeHint(tier);
}
