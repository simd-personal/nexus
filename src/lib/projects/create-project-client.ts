import type { CreateProjectResult } from '@/lib/projects/create-project-core';

type ApiCreateProjectResponse = CreateProjectResult & {
  upgradeRequired?: boolean;
};

/** Create projects via REST so corporate proxies that block Server Actions still work. */
export async function submitCreateProject(formData: FormData): Promise<CreateProjectResult> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });

  const body = (await response.json().catch(() => null)) as ApiCreateProjectResponse | null;

  if (!response.ok) {
    return {
      error: body?.error ?? 'Could not create project. Try signing out and back in.',
      upgradeRequired: body?.upgradeRequired,
    };
  }

  if (body?.data) return { data: body.data };
  if (body?.error) return { error: body.error, upgradeRequired: body.upgradeRequired };

  return { error: 'Could not create project. Please try again.' };
}
