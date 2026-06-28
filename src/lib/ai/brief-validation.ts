/** Validates Sunny Brief output is clean copy-paste prose. */
export function validateBriefProse(content: string): string[] {
  const issues: string[] = [];
  if (!content || content.length < 100) issues.push('content too short');
  if (/^#{1,6}\s/m.test(content)) issues.push('markdown headings (##)');
  if (/\[\d+\]/.test(content)) issues.push('citation brackets [n]');
  if (/\*\*/.test(content)) issues.push('asterisk emphasis');
  if (/[—–]/.test(content)) issues.push('em/en dashes');
  if (/\.\s*,/.test(content)) issues.push('messy ". ," list formatting');
  if (!/Executive Summary/i.test(content)) issues.push('missing Executive Summary section');
  return issues;
}
