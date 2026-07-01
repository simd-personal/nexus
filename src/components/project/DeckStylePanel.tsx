'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import type { ProjectDeckStyle } from '@/lib/projects/deck-style';

type DeckStylePanelProps = {
  projectId: string;
  initialStyle: ProjectDeckStyle;
  onStyleChange?: (style: ProjectDeckStyle) => void;
};

export function DeckStylePanel({ projectId, initialStyle, onStyleChange }: DeckStylePanelProps) {
  const [style, setStyle] = useState<ProjectDeckStyle>(initialStyle);
  const [guidance, setGuidance] = useState(initialStyle.guidance ?? '');
  const [savingGuidance, setSavingGuidance] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setStyle(initialStyle);
    setGuidance(initialStyle.guidance ?? '');
  }, [initialStyle]);

  const updateStyle = useCallback(
    (next: ProjectDeckStyle) => {
      setStyle(next);
      onStyleChange?.(next);
    },
    [onStyleChange]
  );

  async function saveGuidance() {
    setSavingGuidance(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/deck-style`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidance }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save deck guidance.');
        return;
      }
      updateStyle(data.deck_style as ProjectDeckStyle);
      setMessage('Deck guidance saved.');
    } catch {
      setError('Could not save deck guidance.');
    } finally {
      setSavingGuidance(false);
    }
  }

  async function uploadTemplate(file: File) {
    setUploadingTemplate(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/projects/${projectId}/deck-style/template`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Template upload failed.');
        return;
      }
      updateStyle(data.deck_style as ProjectDeckStyle);
      setMessage('Template uploaded. Sunny will use it once processing finishes.');
    } catch {
      setError('Template upload failed.');
    } finally {
      setUploadingTemplate(false);
    }
  }

  async function removeTemplate() {
    setUploadingTemplate(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/deck-style/template`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not remove template.');
        return;
      }
      updateStyle(data.deck_style as ProjectDeckStyle);
      setMessage('Template link removed from deck settings.');
    } catch {
      setError('Could not remove template.');
    } finally {
      setUploadingTemplate(false);
    }
  }

  return (
    <Card className="deck-style-panel">
      <CardHeader
        title="Company deck template"
        description="Upload your house template and spell out how decks should sound. Sunny uses both when generating slides."
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deck voice and operating rules
          </label>
          <textarea
            value={guidance}
            onChange={(event) => setGuidance(event.target.value)}
            rows={4}
            placeholder="Example: Match HackerOne's dark UI tone. 8 slides max. Lead with risks, then mitigation. No jargon in titles."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={saveGuidance} loading={savingGuidance}>
              Save guidance
            </Button>
            {style.updated_at ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated {new Date(style.updated_at).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Reference template file</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            PDF, PowerPoint, Word, or Keynote. Sunny reads structure and tone from the processed text.
          </p>

          {style.template_file_name ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm dark:border-indigo-900/40 dark:bg-[var(--ud-mist)]">
              <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-gray-100">
                {style.template_file_name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void removeTemplate()}
                loading={uploadingTemplate}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ) : (
            <label className="mt-3 inline-flex cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.ppt,.pptx,.docx,.key"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadTemplate(file);
                  event.target.value = '';
                }}
              />
              <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-200">
                <FileUp className="h-4 w-4" />
                {uploadingTemplate ? 'Uploading…' : 'Upload template'}
              </span>
            </label>
          )}
        </div>

        <p className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          Coming soon: native slide export (PowerPoint or Google Slides) saved straight to Files, no copy
          and paste. Today Sunny saves a deck outline to Files automatically after each generation.
        </p>

        {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      </div>
    </Card>
  );
}
