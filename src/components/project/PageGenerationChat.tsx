'use client';

import { SunnyChatInterface } from '@/components/chat/SunnyChatInterface';
import type { ChatMessage } from '@/types/database';

interface PageGenerationChatProps {
  projectId: string;
  type: 'brief' | 'playbook';
  projectName?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
}

export function PageGenerationChat({
  projectId,
  type,
  projectName,
  initialMessages = [],
  initialSessionId,
}: PageGenerationChatProps) {
  return (
    <SunnyChatInterface
      mode={type}
      projectId={projectId}
      projectName={projectName}
      initialMessages={initialMessages}
      initialSessionId={initialSessionId}
      lockProject
    />
  );
}
