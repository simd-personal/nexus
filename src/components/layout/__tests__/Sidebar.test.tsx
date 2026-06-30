import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const pathnameState = vi.hoisted(() => ({ value: '/dashboard' }));

const searchParamsState = vi.hoisted(() => ({
  value: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameState.value,
  useSearchParams: () => searchParamsState.value,
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useThemePreferences', () => ({
  useThemePreferences: () => ({ darkMode: false }),
}));

vi.mock('@/components/brand/UpperDeckLogo', () => ({
  UpperDeckLogo: () => null,
}));

vi.mock('@/components/layout/SidebarAccountFooter', () => ({
  SidebarAccountFooter: () => null,
}));

import { Sidebar } from '@/components/layout/Sidebar';

function hrefForLabel(html: string, label: string): string | undefined {
  const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match = linkPattern.exec(html);
  while (match) {
    const innerText = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (innerText === label) return match[1];
    match = linkPattern.exec(html);
  }
  return undefined;
}

describe('Sidebar project-scoped navigation', () => {
  beforeEach(() => {
    pathnameState.value = '/dashboard';
    searchParamsState.value = new URLSearchParams();
  });

  it('links Search to the global page when not inside a project', () => {
    const html = renderToStaticMarkup(<Sidebar />);
    expect(hrefForLabel(html, 'Search')).toBe('/search');
    expect(hrefForLabel(html, 'Sunny Chat')).toBe('/sunny');
  });

  it('pre-selects the active project when Search is clicked from a project page', () => {
    pathnameState.value = '/projects/proj-123/files';
    const html = renderToStaticMarkup(<Sidebar />);
    expect(hrefForLabel(html, 'Search')).toBe('/projects/proj-123/search');
    expect(hrefForLabel(html, 'Sunny Chat')).toBe('/projects/proj-123/ask-sunny');
  });

  it('carries dashboard portfolio context onto Search links', () => {
    pathnameState.value = '/dashboard';
    searchParamsState.value = new URLSearchParams('portfolio=personal');
    const html = renderToStaticMarkup(<Sidebar />);
    expect(hrefForLabel(html, 'Search')).toBe('/search?portfolio=personal');
    expect(hrefForLabel(html, 'Sunny Chat')).toBe('/sunny?portfolio=personal');
  });

  it('keeps other nav links unscoped inside a project', () => {
    pathnameState.value = '/projects/proj-123/overview';
    const html = renderToStaticMarkup(<Sidebar />);
    expect(hrefForLabel(html, 'Dashboard')).toBe('/dashboard');
    expect(hrefForLabel(html, 'Settings')).toBe('/settings');
    expect(hrefForLabel(html, 'Support')).toBe('/support');
  });
});
