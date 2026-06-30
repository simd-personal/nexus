import { describe, expect, it } from 'vitest';
import { renderSupportRequestEmail } from '@/lib/email/templates';

describe('renderSupportRequestEmail', () => {
  it('formats bug reports for the support inbox', () => {
    const { subject, text } = renderSupportRequestEmail({
      fullName: 'Alex Rivera',
      email: 'alex@acme.com',
      category: 'bug',
      message: 'Search from the dashboard does not submit the query.',
      pageUrl: 'https://upperdeck.dev/support',
    });

    expect(subject).toContain('Bug report');
    expect(subject).toContain('Alex Rivera');
    expect(text).toContain('alex@acme.com');
    expect(text).toContain('Search from the dashboard does not submit the query.');
  });
});
