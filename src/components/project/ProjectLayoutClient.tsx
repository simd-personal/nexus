'use client';

import { ProjectDropZone } from '@/components/project/ProjectDropZone';

export function ProjectLayoutClient({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  return <ProjectDropZone projectId={projectId}>{children}</ProjectDropZone>;
}
