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
  it('routes search and sunny links to the active project pages', () => {
    expect(scopedAppHref('/projects/abc/files', '/search')).toBe('/projects/abc/search');
    expect(scopedAppHref('/projects/abc/files', '/sunny')).toBe('/projects/abc/ask-sunny');
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

  it('encodes project ids in project routes', () => {
    expect(scopedAppHref('/projects/abc%2F123/overview', '/search')).toBe(
      '/projects/abc%2F123/search'
    );
  });
});

describe('sidebar search navigation flow', () => {
  it('routes sidebar search to the project search page', () => {
    const pathname = '/projects/ws-a/files';
    expect(scopedAppHref(pathname, '/search')).toBe('/projects/ws-a/search');
  });
});
