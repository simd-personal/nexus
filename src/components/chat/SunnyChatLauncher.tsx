'use client';

import { useState } from 'react';
import { SunnyChatInterface } from '@/components/chat/SunnyChatInterface';
import type { ProjectWithStats, ChatMessage } from '@/types/database';

interface SunnyChatLauncherProps {
  projects: ProjectWithStats[];
  initialProjectId?: string;
  initialMessages?: ChatMessage[];
}

export function SunnyChatLauncher({
  projects,
  initialProjectId,
  initialMessages = [],
}: SunnyChatLauncherProps) {
  const [projectId, setProjectId] = useState(initialProjectId ?? projects[0]?.id ?? '');
  const selected = projects.find((p) => p.id === projectId);

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        Create a project first, then chat with Sunny.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-center gap-3">
        <label className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client_name} · {p.project_name}
            </option>
          ))}
        </select>
      </div>
      <SunnyChatInterface
        key={projectId}
        mode="project"
        projectId={projectId}
        projectName={selected ? `${selected.client_name} · ${selected.project_name}` : undefined}
        initialMessages={projectId === initialProjectId ? initialMessages : []}
        embedded
      />
    </div>
  );
}
