export type InboundAttachmentViewType = 'image' | 'pdf' | 'text' | 'download';

export function getInboundAttachmentViewType(
  contentType: string,
  filename: string
): InboundAttachmentViewType {
  const lower = filename.toLowerCase();
  const mime = contentType.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf';
  if (
    mime.startsWith('text/') ||
    mime === 'message/rfc822' ||
    /\.(txt|md|markdown|csv|eml|log)$/i.test(lower)
  ) {
    return 'text';
  }
  return 'download';
}

export function formatAttachmentSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
