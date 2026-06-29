'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/EmptyState';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

interface GenerateButtonProps {
  projectId: string;
  type: 'brief' | 'playbook' | 'follow_up_email' | 'deck';
  label: string;
  description?: string;
  instructionsPlaceholder?: string;
}

export function GenerateButton({
  projectId,
  type,
  label,
  description,
  instructionsPlaceholder = 'Tell Sunny what to focus on, tone, audience, or format...',
}: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [version, setVersion] = useState<'short' | 'detailed' | 'executive'>('detailed');
  const [instructions, setInstructions] = useState('');

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          type,
          version: type === 'follow_up_email' ? version : undefined,
          instructions: instructions.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setContent(formatNaturalProse(data.data.content));
        setTitle(data.data.title);
      } else {
        setContent(data.error ?? 'Generation failed. Please try again.');
      }
    } catch {
      setContent('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card>
        <CardHeader title={label} description={description} />
        {type === 'follow_up_email' && (
          <div className="flex gap-2 mb-4">
            {(['short', 'detailed', 'executive'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`px-3 py-1 text-xs rounded-full border capitalize ${
                  version === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 dark:text-gray-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your instructions (optional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder={instructionsPlaceholder}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Generated with GPT 5 High. Natural prose, ready to copy and paste.
          </p>
        </div>
        <Button onClick={handleGenerate} loading={loading}>
          <SunnyAvatar size="xs" animate={loading ? 'work' : 'wave'} />
          Generate with {AI_EMPLOYEE_NAME}
        </Button>
      </Card>

      {loading && (
        <LoadingState message={`${AI_EMPLOYEE_NAME} is generating with GPT 5 High...`} sunny />
      )}

      {content && (
        <Card className="mt-6">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>}
          <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-normal">
            {content}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              Copy to clipboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
