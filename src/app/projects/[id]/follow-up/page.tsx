import { GenerateButton } from '@/components/project/GenerateButton';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export default async function FollowUpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GenerateButton
      projectId={id}
      type="follow_up_email"
      label="Follow-Up Email"
      description={`Draft a professional follow-up email with ${AI_EMPLOYEE_NAME}. Choose short, detailed, or executive version.`}
    />
  );
}
