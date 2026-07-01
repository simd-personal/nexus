export type ChatMode = 'project' | 'search' | 'brief' | 'playbook';

export type ChatModePresentation = {
  workspaceClass: string | null;
  useCoachBranding: boolean;
  headerTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  assistantLabel: string;
  suggestionChipClass: string;
  composerPlaceholder: string;
  suggestions: string[];
};

const PLAYBOOK_SUGGESTIONS = [
  'Build an operating playbook from project materials',
  'Include follow up cadence and owner actions',
  'Emphasize client concerns and operational risks',
  'Make it shorter for a VP read',
] as const;

export function getChatModePresentation(mode: ChatMode): ChatModePresentation {
  if (mode === 'playbook') {
    return {
      workspaceClass: 'playbook-workspace',
      useCoachBranding: true,
      headerTitle: 'Gameplan Coach',
      emptyTitle: 'Build your client gameplan',
      emptyDescription:
        'Turn project evidence into an operating playbook: cadence, owners, risks, and talking points. Purpose-built for the plan, powered by the same intelligence as Sunny.',
      assistantLabel: 'Gameplan Coach',
      suggestionChipClass: 'playbook-suggestion-chip',
      composerPlaceholder: 'Describe the operating plan you need, or ask for a specific section...',
      suggestions: [...PLAYBOOK_SUGGESTIONS],
    };
  }

  return {
    workspaceClass: null,
    useCoachBranding: false,
    headerTitle: '',
    emptyTitle: '',
    emptyDescription: '',
    assistantLabel: '',
    suggestionChipClass: '',
    composerPlaceholder: '',
    suggestions: [],
  };
}

export function chatTitle(mode: ChatMode, aiEmployeeName: string): string {
  if (mode === 'search') return `Chat with ${aiEmployeeName}`;
  if (mode === 'brief') return `Ask ${aiEmployeeName}`;
  if (mode === 'playbook') return getChatModePresentation('playbook').emptyTitle;
  return `Chat with ${aiEmployeeName}`;
}

export function chatDescription(mode: ChatMode): string {
  if (mode === 'brief') {
    return 'Ask questions, generate executive briefs, and refine answers from your project materials. Conversations are saved automatically.';
  }
  if (mode === 'playbook') {
    return getChatModePresentation('playbook').emptyDescription;
  }
  if (mode === 'search') {
    return 'Search your uploaded materials, create decks and emails, or ask about your projects. Pick programs and workstreams to narrow scope.';
  }
  return 'Ask about your project materials or tell Sunny to create emails, decks, and briefs. Responses stream live and conversations are saved automatically.';
}

export function chatSuggestions(mode: ChatMode): string[] {
  if (mode === 'search') {
    return [
      'Tell me everything in the latest Q3 review',
      'Find staffing concerns across all projects',
      'Who mentioned vendor consolidation?',
      'Summarize critical items this week',
    ];
  }
  if (mode === 'brief') {
    return [
      'Generate an executive brief from project materials',
      'Focus on risks and recommended next steps',
      'Make the brief shorter and more executive',
      'Highlight what changed recently',
    ];
  }
  if (mode === 'playbook') {
    return getChatModePresentation('playbook').suggestions;
  }
  return [
    'Draft a follow up email about staffing concerns',
    'Create a Q3 review deck for the board',
    'What are the critical issues?',
    'Pull out action items and add them',
  ];
}
