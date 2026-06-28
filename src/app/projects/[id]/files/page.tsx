import { ProjectFilesClient } from '@/components/project/ProjectFilesClient';
import { getProjectFiles } from '@/lib/data/queries';

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const files = await getProjectFiles(id);

  return <ProjectFilesClient projectId={id} initialFiles={files} />;
}
