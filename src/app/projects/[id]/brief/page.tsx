import { GenerateButton } from '@/components/project/GenerateButton';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export default async function SunnyBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GenerateButton
      projectId={id}
      type="brief"
      label={`${AI_EMPLOYEE_NAME} Brief`}
      description="Generate an executive brief with summary, critical items, concerns, risks, and recommended next steps — all with citations."
    />
  );
}
