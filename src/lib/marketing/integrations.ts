export type IntegrationStatus = 'available' | 'beta' | 'coming_soon' | 'enterprise';

export type Integration = {
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
};

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  available: 'Available',
  beta: 'Beta',
  coming_soon: 'Coming soon',
  enterprise: 'Enterprise',
};

export const INTEGRATIONS: Integration[] = [
  {
    name: 'File upload',
    category: 'Core',
    description: 'PDF, DOCX, decks, CSV, audio, transcripts, and email (.eml) files.',
    status: 'available',
  },
  {
    name: 'Gmail & Outlook',
    category: 'Email',
    description: 'Sync client threads into projects automatically — no more forwarding.',
    status: 'coming_soon',
  },
  {
    name: 'Slack',
    category: 'Messaging',
    description: 'Pull channel history and DMs into client context. Ask Sunny what was decided.',
    status: 'coming_soon',
  },
  {
    name: 'Google Drive',
    category: 'Storage',
    description: 'Connect folders per client. New decks and docs sync into your command deck.',
    status: 'coming_soon',
  },
  {
    name: 'Microsoft Teams',
    category: 'Meetings',
    description: 'Meeting recordings and chat transcripts flow into project intelligence.',
    status: 'coming_soon',
  },
  {
    name: 'Zoom',
    category: 'Meetings',
    description: 'Auto-import cloud recordings and AI summaries per client project.',
    status: 'coming_soon',
  },
  {
    name: 'Notion',
    category: 'Docs',
    description: 'Sync client wikis and meeting notes into searchable project memory.',
    status: 'coming_soon',
  },
  {
    name: 'HubSpot',
    category: 'CRM',
    description: 'Link deals and contacts so Sunny knows the full client relationship.',
    status: 'enterprise',
  },
  {
    name: 'Salesforce',
    category: 'CRM',
    description: 'Opportunity context, activity history, and account notes in one view.',
    status: 'enterprise',
  },
  {
    name: 'Linear & Jira',
    category: 'Delivery',
    description: 'Connect delivery work to client promises — spot gaps before the client does.',
    status: 'enterprise',
  },
  {
    name: 'Calendar',
    category: 'Scheduling',
    description: 'Google Calendar & Outlook — prep briefs before every client call.',
    status: 'beta',
  },
];
