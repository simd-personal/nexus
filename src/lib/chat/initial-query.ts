export function consumeInitialQuery(key: string): boolean {
  if (typeof window === 'undefined') return true;
  const storageKey = `briefnexus:sent:${key}`;
  if (sessionStorage.getItem(storageKey)) return false;
  sessionStorage.setItem(storageKey, '1');
  return true;
}
