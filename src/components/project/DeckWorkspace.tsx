'use client';

import { useState } from 'react';
import { DeckStylePanel } from '@/components/project/DeckStylePanel';
import { GenerateButton } from '@/components/project/GenerateButton';
import type { ProjectDeckStyle } from '@/lib/projects/deck-style';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export function DeckWorkspace({
  projectId,
  initialDeckStyle,
}: {
  projectId: string;
  initialDeckStyle: ProjectDeckStyle;
}) {
  const [deckStyle, setDeckStyle] = useState(initialDeckStyle);

  return (
    <div className="space-y-6">
      <DeckStylePanel
        projectId={projectId}
        initialStyle={initialDeckStyle}
        onStyleChange={setDeckStyle}
      />
      <GenerateButton
        projectId={projectId}
        type="deck"
        label="Presentation Deck"
        description={`${AI_EMPLOYEE_NAME} generates a client-ready presentation outline using your company template, deck rules, and project materials.`}
        instructionsPlaceholder="e.g. Q3 board review deck, 8 slides, focus on risks and next steps..."
        deckStyleConfigured={Boolean(deckStyle.guidance?.trim() || deckStyle.template_file_id)}
      />
    </div>
  );
}
