import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { updateProjectRelevance } from '@/lib/actions/projects';

function joinKeywords(values: string[] | null | undefined): string {
  return (values ?? []).join(', ');
}

interface ProjectRelevancePanelProps {
  projectId: string;
  watchKeywords: string[];
  myRole: string | null;
}

export function ProjectRelevancePanel({
  projectId,
  watchKeywords,
  myRole,
}: ProjectRelevancePanelProps) {
  return (
    <Card>
      <CardHeader
        title="Action item relevance"
        description="Sunny uses these terms to filter transcript noise and surface follow-ups for you."
      />
      <form action={updateProjectRelevance.bind(null, projectId)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project keywords
          </label>
          <input
            name="watch_keywords"
            defaultValue={joinKeywords(watchKeywords)}
            placeholder="Epic, Conifer, cutover"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            My role on this project
          </label>
          <input
            name="my_role"
            defaultValue={myRole ?? ''}
            placeholder="Program lead, UpperDeck"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
          />
        </div>
        <Button type="submit" size="sm">
          Save relevance settings
        </Button>
      </form>
    </Card>
  );
}
