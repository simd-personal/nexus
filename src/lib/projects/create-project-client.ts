import { createProject } from '@/lib/actions/projects';
import type { CreateProjectResult } from '@/lib/projects/create-project-core';

type ApiCreateProjectResponse = CreateProjectResult & {
  upgradeRequired?: boolean;
};

async function createProjectViaApi(formData: FormData): Promise<CreateProjectResult> {
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

/** Prefer server action; fall back to REST when proxies block Next.js server actions. */
export async function submitCreateProject(formData: FormData): Promise<CreateProjectResult> {
  try {
    const result = await createProject(formData);
    if (result.data || result.error) return result;
  } catch {
    // Server action rejected (e.g. 403 behind corporate proxy) — use API route.
  }

  return createProjectViaApi(formData);
}
