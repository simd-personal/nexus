import { DeckWorkspace } from '@/components/project/DeckWorkspace';
import { getProject } from '@/lib/data/queries';
import { parseProjectDeckStyle } from '@/lib/projects/deck-style';
import { notFound } from 'next/navigation';

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <DeckWorkspace projectId={id} initialDeckStyle={parseProjectDeckStyle(project.deck_style)} />
  );
}
