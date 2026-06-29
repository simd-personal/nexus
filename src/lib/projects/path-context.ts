const PROJECT_PATH_RE = /^\/projects\/([^/]+)(?:\/|$)/;

/** Project id when the user is on any /projects/[id]/… route. */
export function projectIdFromPathname(pathname: string): string | undefined {
  return pathname.match(PROJECT_PATH_RE)?.[1];
}

/** Scope global app routes to the current project when browsing inside one. */
export function scopedAppHref(pathname: string, href: string): string {
  const projectId = projectIdFromPathname(pathname);
  if (!projectId) return href;

  if (href === '/search' || href === '/sunny') {
    return `${href}?project=${encodeURIComponent(projectId)}`;
  }

  return href;
}
