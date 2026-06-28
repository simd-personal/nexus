import { GenerateButton } from '@/components/project/GenerateButton';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GenerateButton
      projectId={id}
      type="deck"
      label="Presentation Deck"
      description={`${AI_EMPLOYEE_NAME} generates a client-ready presentation outline from your project materials using ChatGPT.`}
      instructionsPlaceholder="e.g. Q3 board review deck, 8 slides, focus on risks and next steps..."
    />
  );
}
