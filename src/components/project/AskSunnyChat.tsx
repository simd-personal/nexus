'use client';

import { SunnyChatInterface } from '@/components/chat/SunnyChatInterface';
import type { ChatMessage } from '@/types/database';

interface AskSunnyChatProps {
  projectId: string;
  initialMessages: ChatMessage[];
  projectName?: string;
  initialSessionId?: string;
}

export function AskSunnyChat(props: AskSunnyChatProps) {
  return (
    <SunnyChatInterface
      mode="project"
      projectId={props.projectId}
      projectName={props.projectName}
      initialMessages={props.initialMessages}
      initialSessionId={props.initialSessionId}
    />
  );
}
