import { GenerateButton } from '@/components/project/GenerateButton';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GenerateButton
      projectId={id}
      type="playbook"
      label="Operating Playbook"
      description={`Generate a comprehensive client operating playbook with ${AI_EMPLOYEE_NAME} — grounded in your project evidence.`}
    />
  );
}
