/** Hand off a project id before navigating to the Sunny tab. */
let pendingProjectId: string | null = null;

export function openSunnyForProject(projectId: string) {
  pendingProjectId = projectId;
}

export function consumePendingSunnyProjectId(): string | null {
  const id = pendingProjectId;
  pendingProjectId = null;
  return id;
}
