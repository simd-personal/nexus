import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockSingle = vi.fn();
const mockDownload = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        download: mockDownload,
      })),
    },
  })),
}));

import { GET } from '@/app/api/files/[id]/view/route';

describe('GET /api/files/[id]/view integration', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example/signed' },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: {
        id: 'file-1',
        file_name: 'brief.md',
        file_type: 'text/markdown',
        storage_path: 'proj-1/123-brief.md',
        extracted_text: '# Hello\n\nDenver approved.',
        status: 'processed',
        project_id: 'proj-1',
      },
      error: null,
    });
  });

  it('returns text view for markdown files', async () => {
    const req = new NextRequest('http://localhost:3000/api/files/file-1/view');
    const res = await GET(req, { params: Promise.resolve({ id: 'file-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.viewType).toBe('text');
    expect(body.text).toContain('Denver approved');
    expect(body.hasOriginal).toBe(true);
    expect(body.url).toBe('https://storage.example/signed');
  });

  it('returns spreadsheet view for xlsx files', async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Owner', 'Action'],
      ['Billing', 'Appeal denials'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Plan');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    mockSingle.mockResolvedValue({
      data: {
        id: 'file-2',
        file_name: 'action-plan.xlsx',
        file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        storage_path: 'proj-1/123-plan.xlsx',
        extracted_text: null,
        status: 'uploaded_unprocessed',
        project_id: 'proj-1',
      },
      error: null,
    });
    mockDownload.mockResolvedValue({
      data: new Blob([buffer]),
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/files/file-2/view');
    const res = await GET(req, { params: Promise.resolve({ id: 'file-2' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.viewType).toBe('spreadsheet');
    expect(body.sheets).toHaveLength(1);
    expect(body.sheets[0].rows[1]).toEqual(['Billing', 'Appeal denials']);
    expect(body.text).toContain('Appeal denials');
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/files/file-1/view');
    const res = await GET(req, { params: Promise.resolve({ id: 'file-1' }) });
    expect(res.status).toBe(401);
  });
});
