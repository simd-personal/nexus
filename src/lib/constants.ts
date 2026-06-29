import type {
  CriticalCategory,
  ProjectStatus,
  Severity,
  SourceType,
} from '@/types/database';

export const APP_NAME = 'UpperDeck';
export const APP_DOMAIN = 'upperdeck.dev';
export const SUPPORT_EMAIL = `support@${APP_DOMAIN}`;
export const AI_EMPLOYEE_NAME = 'Sunny';
/** Brand guide tagline */
export const BRAND_TAGLINE = 'Your first AI employee for client work';
/** Marketing / hero copy */
export const TAGLINE =
  'Hire Sunny once. Client briefs, risks, and follow ups from every deck, email, and call.';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  critical: 'Critical',
  needs_review: 'Needs Review',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CATEGORY_LABELS: Record<CriticalCategory, string> = {
  conflict: 'Conflict',
  risk: 'Risk',
  missed_follow_up: 'Missed Follow Up',
  client_concern: 'Client Concern',
  ownership_gap: 'Ownership Gap',
  timeline_issue: 'Timeline Issue',
  broken_process: 'Broken Process',
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  meeting: 'Meeting',
  email: 'Email',
  deck: 'Deck',
  pdf: 'PDF',
  note: 'Note',
  transcript: 'Transcript',
  audio: 'Audio',
  csv: 'CSV',
  other: 'Other',
};

export const SUPPORTED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.pdf', '.docx', '.csv', '.xlsx', '.xls',
  '.mp3', '.m4a', '.wav', '.eml',
  '.png', '.jpg', '.jpeg', '.webp',
  '.vtt', '.srt',
];

export const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav'];

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

export const TRANSCRIPT_EXTENSIONS = ['.vtt', '.srt'];

export const MIME_TO_SOURCE: Record<string, SourceType> = {
  'text/plain': 'note',
  'text/markdown': 'note',
  'text/x-markdown': 'note',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'pdf',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'csv',
  'application/vnd.ms-excel': 'csv',
  'message/rfc822': 'email',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'image/png': 'note',
  'image/jpeg': 'note',
  'image/jpg': 'note',
  'image/webp': 'note',
  'text/vtt': 'transcript',
};

export function inferSourceType(fileName: string, mimeType?: string): SourceType {
  const lower = fileName.toLowerCase();
  if (lower.includes('deck') || lower.includes('presentation') || lower.includes('slides')) {
    return 'deck';
  }
  if (
    lower.includes('transcript') ||
    lower.endsWith('.vtt') ||
    lower.endsWith('.srt')
  ) {
    return 'transcript';
  }
  if (lower.includes('meeting')) return 'meeting';
  if (lower.endsWith('.eml') || lower.includes('email')) return 'email';
  if (AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'audio';
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'note';
  if (mimeType && MIME_TO_SOURCE[mimeType]) return MIME_TO_SOURCE[mimeType];
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'csv';
  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.markdown')) return 'note';
  return 'other';
}

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

export function isProcessable(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(getFileExtension(fileName));
}
