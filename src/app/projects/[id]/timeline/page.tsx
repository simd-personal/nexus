import { TimelineView } from '@/components/project/TimelineView';
import { getProjectTimeline } from '@/lib/data/queries';

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const events = await getProjectTimeline(id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h2>
      <TimelineView events={events} />
    </div>
  );
}
