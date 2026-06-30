/** Build the Sunny search URL used by the dashboard and project global search bars. */
export function buildGlobalSearchHref(query: string, projectId?: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({ q: trimmed });
  if (projectId) params.set('project', projectId);
  return `/search?${params.toString()}`;
}
