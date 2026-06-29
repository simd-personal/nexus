'use client';

import { EntityMentionsPanel } from '@/components/project/EntityMentionsPanel';
import { useState } from 'react';

type EntityChipItem = {
  id: string;
  name: string;
};

const chipClassName =
  'rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 dark:bg-[var(--ud-cloud)] dark:text-gray-300 dark:hover:bg-amber-500 dark:hover:text-gray-900 dark:focus:ring-offset-[var(--ud-mist)]';

export function EntityMentionChips({
  projectId,
  entities,
  type,
  includeSubProjects,
}: {
  projectId: string;
  entities: EntityChipItem[];
  type: 'person' | 'facility';
  includeSubProjects?: boolean;
}) {
  const [selected, setSelected] = useState<{ name: string; type: 'person' | 'facility' } | null>(
    null
  );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {entities.map((entity) => (
          <button
            key={entity.id}
            type="button"
            className={chipClassName}
            aria-haspopup="dialog"
            onClick={() => setSelected({ name: entity.name, type })}
          >
            {entity.name}
          </button>
        ))}
      </div>

      {selected && (
        <EntityMentionsPanel
          projectId={projectId}
          name={selected.name}
          type={selected.type}
          includeSubProjects={includeSubProjects}
          open
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
