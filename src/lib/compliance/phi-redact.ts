export interface PhiRedactionResult {
  text: string;
  redactionCount: number;
  categories: string[];
}

interface RedactionPattern {
  category: string;
  pattern: RegExp;
  replacement: string;
}

const PHI_PATTERNS: RedactionPattern[] = [
  {
    category: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED-SSN]',
  },
  {
    category: 'mrn',
    pattern: /\b(?:MRN|Medical Record(?: Number)?|Patient ID)[:\s#-]*[A-Z0-9-]{4,}\b/gi,
    replacement: '[REDACTED-MRN]',
  },
  {
    category: 'dob',
    pattern:
      /\b(?:DOB|Date of Birth|Birth Date)[:\s]*(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/gi,
    replacement: '[REDACTED-DOB]',
  },
  {
    category: 'phone',
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[REDACTED-PHONE]',
  },
  {
    category: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[REDACTED-EMAIL]',
  },
  {
    category: 'patient_label',
    pattern: /\b(?:Patient|Pt\.?)[:\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z'.-]+){0,3}\b/g,
    replacement: '[REDACTED-PATIENT]',
  },
  {
    category: 'member_id',
    pattern: /\b(?:Member ID|Subscriber ID|Insurance ID)[:\s#-]*[A-Z0-9-]{4,}\b/gi,
    replacement: '[REDACTED-ID]',
  },
];

export function redactPhi(text: string): PhiRedactionResult {
  if (!text.trim()) {
    return { text, redactionCount: 0, categories: [] };
  }

  let redacted = text;
  let redactionCount = 0;
  const categories = new Set<string>();

  for (const { category, pattern, replacement } of PHI_PATTERNS) {
    const matches = redacted.match(pattern);
    if (!matches?.length) continue;
    redactionCount += matches.length;
    categories.add(category);
    redacted = redacted.replace(pattern, replacement);
  }

  return {
    text: redacted,
    redactionCount,
    categories: [...categories],
  };
}

export function redactPhiPages(
  pages: Array<{ pageNumber: number; text: string }>
): { pages: Array<{ pageNumber: number; text: string }>; redactionCount: number; categories: string[] } {
  const categories = new Set<string>();
  let redactionCount = 0;

  const redactedPages = pages.map((page) => {
    const result = redactPhi(page.text);
    redactionCount += result.redactionCount;
    result.categories.forEach((category) => categories.add(category));
    return { pageNumber: page.pageNumber, text: result.text };
  });

  return {
    pages: redactedPages,
    redactionCount,
    categories: [...categories],
  };
}
