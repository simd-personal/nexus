import { describe, expect, it } from 'vitest';
import { matchProjectFromSubject } from '@/lib/inbound/match-project';

const projects = [
  {
    id: 'proj-a',
    client_name: 'Acme Corp',
    project_name: 'Q3 Review',
    last_activity_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proj-b',
    client_name: 'Globex',
    project_name: 'Platform Migration',
    last_activity_at: '2026-06-01T00:00:00Z',
  },
];

describe('matchProjectFromSubject', () => {
  it('returns the only project when there is one', () => {
    const [only] = projects;
    expect(matchProjectFromSubject('anything', [only])).toEqual(only);
  });

  it('matches bracketed client and project names', () => {
    expect(matchProjectFromSubject('[Acme · Q3 Review] Fwd: budget', projects)?.id).toBe('proj-a');
  });

  it('matches client and project names in the subject', () => {
    expect(matchProjectFromSubject('Re: Globex platform migration update', projects)?.id).toBe('proj-b');
  });

  it('returns null when ambiguous', () => {
    expect(matchProjectFromSubject('weekly update', projects)).toBeNull();
  });
});
