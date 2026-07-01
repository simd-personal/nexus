import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Legacy route — global chat lives at /sunny. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ portfolio?: string; q?: string; project?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.project) query.set('project', params.project);
  if (params.portfolio) query.set('portfolio', params.portfolio);
  const suffix = query.toString();
  redirect(suffix ? `/sunny?${suffix}` : '/sunny');
}
