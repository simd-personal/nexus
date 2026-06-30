import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import type { ActiveUploadBatch } from '@/lib/processing/upload-batch';
import { Loader2 } from 'lucide-react';

function formatFileList(fileNames: string[], max = 3): string {
  if (fileNames.length <= max) return fileNames.join(', ');
  const shown = fileNames.slice(0, max).join(', ');
  return `${shown} (+${fileNames.length - max} more)`;
}

export function IndexingBatchCard({ batch }: { batch: ActiveUploadBatch }) {
  return (
    <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <SunnyAvatar size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-600" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Indexing {batch.total} files
            </h4>
          </div>
          <Link
            href={`/projects/${batch.projectId}/files`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {batch.clientName} · {batch.projectName}
          </Link>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {formatFileList(batch.fileNames)}
          </p>
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
            {batch.done} of {batch.total} ready — Sunny will post one summary when indexing finishes.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function IndexingBatchList({ batches }: { batches: ActiveUploadBatch[] }) {
  if (!batches.length) return null;

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <IndexingBatchCard key={batch.batchId} batch={batch} />
      ))}
    </div>
  );
}
