import { redirect } from 'next/navigation';

export default async function SunnyBriefRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}/ask-sunny`);
}
