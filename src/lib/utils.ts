import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatRelativeTime, formatUploadDate, formatFileUploadTime } from '@upperdeck/shared/format';

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function normalizeEntityName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}
