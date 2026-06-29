import { describe, expect, it } from 'vitest';
import { projectIdFromPathname, scopedAppHref } from '@/lib/projects/path-context';

describe('projectIdFromPathname', () => {
  it('extracts project id from project routes', () => {
    expect(projectIdFromPathname('/projects/abc/overview')).toBe('abc');
    expect(projectIdFromPathname('/projects/abc')).toBe('abc');
    expect(projectIdFromPathname('/projects/abc/files')).toBe('abc');
    expect(projectIdFromPathname('/projects/abc/search')).toBe('abc');
  });

  it('returns undefined outside project routes', () => {
    expect(projectIdFromPathname('/dashboard')).toBeUndefined();
    expect(projectIdFromPathname('/search')).toBeUndefined();
    expect(projectIdFromPathname('/search?project=abc')).toBeUndefined();
    expect(projectIdFromPathname('/projects')).toBeUndefined();
  });
});

describe('scopedAppHref', () => {
  it('scopes search and sunny links to the active project', () => {
    expect(scopedAppHref('/projects/abc/files', '/search')).toBe('/search?project=abc');
    expect(scopedAppHref('/projects/abc/files', '/sunny')).toBe('/sunny?project=abc');
  });

  it('leaves global links unchanged off project pages', () => {
    expect(scopedAppHref('/dashboard', '/search')).toBe('/search');
    expect(scopedAppHref('/dashboard', '/sunny')).toBe('/sunny');
    expect(scopedAppHref('/updates', '/search')).toBe('/search');
  });

  it('does not scope unrelated sidebar routes', () => {
    expect(scopedAppHref('/projects/abc/overview', '/dashboard')).toBe('/dashboard');
    expect(scopedAppHref('/projects/abc/overview', '/settings')).toBe('/settings');
    expect(scopedAppHref('/projects/abc/overview', '/projects')).toBe('/projects');
  });

  it('encodes project ids for query strings', () => {
    expect(scopedAppHref('/projects/abc%2F123/overview', '/search')).toBe(
      '/search?project=abc%252F123'
    );
  });
});

describe('sidebar search navigation flow', () => {
  it('builds a search URL that GlobalChatPageClient can parse', () => {
    const pathname = '/projects/ws-a/files';
    const searchHref = scopedAppHref(pathname, '/search');
    expect(searchHref).toBe('/search?project=ws-a');

    const params = new URLSearchParams(searchHref.split('?')[1] ?? '');
    expect(params.get('project')).toBe('ws-a');
  });
});
