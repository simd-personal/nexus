export interface ProjectMatchCandidate {
  id: string;
  client_name: string;
  project_name: string;
  last_activity_at: string | null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreProject(subject: string, project: ProjectMatchCandidate): number {
  const normalizedSubject = normalize(subject);
  const client = normalize(project.client_name);
  const name = normalize(project.project_name);
  const combined = `${client} ${name}`.trim();
  let score = 0;

  if (client && normalizedSubject.includes(client)) score += 4;
  if (name && normalizedSubject.includes(name)) score += 5;
  if (combined && normalizedSubject.includes(combined)) score += 3;

  const bracketMatch = subject.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    const bracket = normalize(bracketMatch[1]);
    if (bracket.includes(client) || bracket.includes(name)) score += 6;
    if (bracket.includes('·') || bracket.includes('|')) {
      const parts = bracket.split(/[·|]/).map((part) => part.trim());
      if (parts.some((part) => part && (client.includes(part) || name.includes(part) || part.includes(client) || part.includes(name)))) {
        score += 4;
      }
    }
  }

  return score;
}

export function matchProjectFromSubject(
  subject: string,
  projects: ProjectMatchCandidate[]
): ProjectMatchCandidate | null {
  if (!projects.length) return null;
  if (projects.length === 1) return projects[0];

  const ranked = projects
    .map((project) => ({ project, score: scoreProject(subject, project) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.project.last_activity_at ? Date.parse(a.project.last_activity_at) : 0;
      const bTime = b.project.last_activity_at ? Date.parse(b.project.last_activity_at) : 0;
      return bTime - aTime;
    });

  if (!ranked.length) return null;
  if (ranked.length > 1 && ranked[0].score === ranked[1].score) return null;
  return ranked[0].project;
}
