import mammoth from 'mammoth';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function isDocxFile(fileName: string, mimeType?: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.docx')) return true;
  return mimeType === DOCX_MIME;
}

export async function convertDocxBufferToHtml(buffer: Buffer): Promise<{
  html: string;
  text: string;
}> {
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ buffer }),
    mammoth.extractRawText({ buffer }),
  ]);

  return {
    html: htmlResult.value.trim(),
    text: textResult.value.trim(),
  };
}
