export type DataSecurityTier = 'all' | 'pro' | 'enterprise';

export type DataSecurityBadge = {
  id: string;
  label: string;
  detail: string;
};

export type DataSecuritySection = {
  title: string;
  intro: string;
  badges: DataSecurityBadge[];
  bullets: string[];
  commitment?: string;
};

/** Trust practices shown to every account — not third-party certification claims. */
export const DATA_SECURITY_BADGES: DataSecurityBadge[] = [
  {
    id: 'tls',
    label: 'Encrypted in transit',
    detail: 'HTTPS/TLS for every upload, download, and API request.',
  },
  {
    id: 'private-storage',
    label: 'Private file storage',
    detail: 'Files live in a private object store, not a public bucket or CDN.',
  },
  {
    id: 'tenant-isolation',
    label: 'Tenant isolation',
    detail: 'Row Level Security keeps each account’s projects and files separated.',
  },
  {
    id: 'no-training',
    label: 'No model training',
    detail: 'Your project content is not used to train UpperDeck or foundation models.',
  },
];

export const DATA_SECURITY_ALL_USERS: DataSecuritySection = {
  title: 'How your files are protected',
  intro:
    'Client materials stay in your private UpperDeck workspace. We built the product so uploads are scoped to your projects, stored securely, and only processed when you ask Sunny to read them.',
  badges: DATA_SECURITY_BADGES,
  bullets: [
    'Original files are stored in encrypted private cloud storage (Supabase on AWS infrastructure).',
    'Database records and extracted text use the same tenant isolation. Only your signed-in account can access your projects.',
    'AI features send only the minimum text needed for each request; API keys stay on our servers, never in the browser or mobile app.',
    'You can delete individual files or entire projects at any time; deletions remove stored objects and derived search indexes.',
    'We do not sell your content or use it for advertising.',
  ],
  commitment:
    'Your uploads stay private to your workspace. You own your content and can delete it anytime.',
};

export const DATA_SECURITY_PRO_ADDITIONS: DataSecuritySection = {
  title: 'Pro data handling',
  intro: 'Pro unlocks more Sunny usage and projects. Storage and privacy protections stay the same.',
  badges: [],
  bullets: [
    'Same private storage, encryption, and tenant isolation from day one.',
    'Higher usage limits do not change who can access your files. Still only you (and your org admins on Enterprise).',
  ],
};

export const DATA_SECURITY_ENTERPRISE_ADDITIONS: DataSecuritySection = {
  title: 'Enterprise safeguards',
  intro:
    'Organization tenants add admin controls and optional healthcare safeguards on top of the standard storage protections.',
  badges: [
    {
      id: 'phi-redaction',
      label: 'PHI redaction option',
      detail: 'Detect and replace identifiers before indexing when enabled by your admin.',
    },
    {
      id: 'org-admin',
      label: 'Admin access controls',
      detail: 'Centralized organization membership and access requests.',
    },
    {
      id: 'security-docs',
      label: 'Security documentation',
      detail: 'Data handling summary and subprocessors list available with enterprise agreements.',
    },
  ],
  bullets: [
    'Organization admins can enable PHI redaction during file processing for healthcare workflows.',
    'Team access is managed through organization membership, not shared passwords.',
    'Enterprise quotes can include a written data handling summary and support for vendor security reviews.',
  ],
  commitment:
    'Full HIPAA or SOC 2 compliance programs require a signed enterprise agreement, legal review, and BAAs where applicable. Contact us before uploading regulated health data at scale.',
};

export function resolveDataSecuritySections(tier: DataSecurityTier): DataSecuritySection[] {
  const sections = [DATA_SECURITY_ALL_USERS];
  if (tier === 'pro') sections.push(DATA_SECURITY_PRO_ADDITIONS);
  if (tier === 'enterprise') sections.push(DATA_SECURITY_ENTERPRISE_ADDITIONS);
  return sections;
}

/** Short reassurance shown at upload — hover/focus on the info icon next to Upload Center. */
export const UPLOAD_SECURITY_TOOLTIP =
  'Files upload to encrypted private storage, isolated to your account and this project. Only you can access them. Sunny reads content to answer your questions, not to train AI models.';
