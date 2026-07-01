import { redirect } from 'next/navigation';

/** Legacy route — project chat lives at ask-sunny (search retrieval path). */
export default async function ProjectSearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}/ask-sunny`);
}
