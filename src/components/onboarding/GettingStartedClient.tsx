'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  FileText,
  Sparkles,
  Upload,
} from 'lucide-react';
import { createProject } from '@/lib/actions/projects';
import { AI_EMPLOYEE_NAME, APP_NAME } from '@/lib/constants';
import { ONBOARDING_SAMPLE_MEETING_NOTES } from '@/lib/onboarding/sample-content';
import type { OnboardingStep } from '@/lib/onboarding/status';
import { kickFileProcessing, uploadProjectFile } from '@/lib/upload/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UpperDeckIcon } from '@/components/brand/UpperDeckLogo';
import type { ProjectWithStats } from '@/types/database';

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: 'project', label: 'Client project' },
  { id: 'upload', label: 'First upload' },
  { id: 'processing', label: 'Sunny reads' },
  { id: 'complete', label: 'Ready' },
];

type GettingStartedClientProps = {
  initialStep: OnboardingStep;
  project: ProjectWithStats | null;
  activeFileId: string | null;
  initialSummary: string | null;
};

export function GettingStartedClient({
  initialStep,
  project,
  activeFileId,
  initialSummary,
}: GettingStartedClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [projectState, setProjectState] = useState(project);
  const [fileId, setFileId] = useState<string | null>(activeFileId);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressLabel, setProgressLabel] = useState('Queued for processing…');
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    setStep(initialStep);
    setProjectState(project);
    setFileId(activeFileId);
    setSummary(initialSummary);
  }, [initialStep, project, activeFileId, initialSummary]);

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  const pollProjectSummary = useCallback(async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = (await response.json()) as { last_summary?: string | null };
    return data.last_summary ?? null;
  }, []);

  useEffect(() => {
    if (step !== 'processing' || !fileId || !projectState) return;

    let cancelled = false;
    kickFileProcessing(fileId);

    async function poll() {
      for (let attempt = 0; attempt < 90; attempt++) {
        if (cancelled) return;

        const response = await fetch(`/api/files/${fileId}/process`, { cache: 'no-store' });
        if (response.ok) {
          const data = (await response.json()) as {
            status: string;
            progress?: { label?: string; percent?: number };
          };

          setProgressLabel(data.progress?.label ?? 'Sunny is reading…');
          setProgressPercent(data.progress?.percent ?? Math.min(95, attempt * 3));

          if (['processed', 'watch', 'critical'].includes(data.status)) {
            const projectId = projectState?.id;
            const nextSummary = projectId ? await pollProjectSummary(projectId) : null;
            if (!cancelled) {
              setSummary(nextSummary);
              setStep('complete');
              router.refresh();
            }
            return;
          }

          if (data.status === 'failed') {
            if (!cancelled) {
              setError('Processing failed. Try uploading again or use the sample notes.');
              setStep('upload');
            }
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!cancelled) {
        setError('Processing is taking longer than expected. You can continue to your project and check back shortly.');
        setStep('complete');
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [step, fileId, projectState, pollProjectSummary, router]);

  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createProject(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      setProjectState({
        ...result.data,
        file_count: 0,
        meeting_count: 0,
        email_count: 0,
        critical_item_count: 0,
        action_item_count: 0,
        last_sunny_update: null,
      });
      setStep('upload');
      setLoading(false);
      router.refresh();
    }
  }

  async function uploadContent(text: string, pastedType: 'meeting' | 'note') {
    if (!projectState) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('project_id', projectState.id);
    formData.append('pasted_text', text);
    formData.append('pasted_type', pastedType);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? 'Upload failed');
        setLoading(false);
        return;
      }

      const uploadedId = data.data?.id as string | undefined;
      if (uploadedId) {
        setFileId(uploadedId);
        setStep('processing');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectState) return;

    setLoading(true);
    setError('');
    const result = await uploadProjectFile(projectState.id, file);
    if (!result.ok || !result.fileId) {
      setError(result.error ?? 'Upload failed');
      setLoading(false);
      return;
    }

    setFileId(result.fileId);
    setStep('processing');
    setLoading(false);
    e.target.value = '';
  }

  const projectLabel = useMemo(() => {
    if (!projectState) return null;
    return `${projectState.client_name} · ${projectState.project_name}`;
  }, [projectState]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <UpperDeckIcon size={40} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7c6cf0]">
            Getting started
          </p>
          <h1 className="app-page-title text-2xl">
            Hire {AI_EMPLOYEE_NAME} in three steps
          </h1>
        </div>
      </div>

      <ol className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((item, index) => {
          const done = index < stepIndex;
          const active = item.id === step;
          return (
            <li
              key={item.id}
              className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
                active
                  ? 'border-[#7c6cf0] bg-[#f5f3fe] text-[#5b4de0] dark:border-[#7c6cf0] dark:bg-[#2a2540]'
                  : done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'border-gray-200 text-gray-500 dark:border-[var(--ud-cloud)] dark:text-gray-400'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 'project' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 1 · Name your first client project
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {AI_EMPLOYEE_NAME} keeps context per client. Start with one engagement — you can add more
            after you see the brief.
          </p>

          <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
            <Field label="Client name" name="client_name" placeholder="e.g. Acme Health" required />
            <Field
              label="Project name"
              name="project_name"
              placeholder="e.g. Q3 board prep"
              required
            />
            <Field
              label="What should Sunny watch for? (optional)"
              name="sunny_notes"
              placeholder="e.g. timeline risks, budget conflicts, staffing gaps…"
              multiline
            />
            <Button type="submit" loading={loading}>
              Create project
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}

      {step === 'upload' && projectState && (
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-[#7c6cf0]">{projectLabel}</p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 2 · Give {AI_EMPLOYEE_NAME} something to read
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Drop a deck, PDF, or notes — or try our sample meeting notes to see a brief in under a
            minute.
          </p>

          <label className="mt-6 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-10 text-center transition-colors hover:border-[#7c6cf0] hover:bg-[#faf9ff] dark:border-[var(--ud-cloud)] dark:hover:border-[#7c6cf0] dark:hover:bg-[#2a2540]/40">
            <Upload className="mb-3 h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Drag a file here or click to browse
            </span>
            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              PDF, DOCX, TXT, email, transcript, image, audio
            </span>
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading} />
          </label>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              loading={loading}
              onClick={() => uploadContent(ONBOARDING_SAMPLE_MEETING_NOTES, 'meeting')}
              className="flex-1 justify-center"
            >
              <FileText className="h-4 w-4" />
              Try sample meeting notes
            </Button>
          </div>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#5b9cf6] to-[#7c6cf0] text-white">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 3 · {AI_EMPLOYEE_NAME} is reading your project
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{progressLabel}</p>
          <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-gray-100 dark:bg-[var(--ud-cloud)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5b9cf6] to-[#7c6cf0] transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, 8)}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Extracting text, indexing for search, and drafting your first brief…
          </p>
        </Card>
      )}

      {step === 'complete' && projectState && (
        <Card>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {AI_EMPLOYEE_NAME} is on the job
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {projectLabel} is ready in {APP_NAME}. Ask questions, search materials, or review
                critical items — every answer cites your files.
              </p>
            </div>
          </div>

          {summary && (
            <div className="mt-6 rounded-lg border border-[#e9e2fd] bg-[#faf9ff] p-4 dark:border-[#7c6cf0]/30 dark:bg-[#2a2540]/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7c6cf0]">
                First brief excerpt
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                {summary.length > 420 ? `${summary.slice(0, 420).trim()}…` : summary}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={`/projects/${projectState.id}/overview`} className="sm:flex-1">
              <Button className="w-full justify-center">
                View project
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/projects/${projectState.id}/ask-sunny`} className="sm:flex-1">
              <Button variant="secondary" className="w-full justify-center">
                Ask {AI_EMPLOYEE_NAME}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-center sm:w-auto">
                Go to dashboard
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  multiline,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const className =
    'w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c6cf0]/40 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100';

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          placeholder={placeholder}
          className={`${className} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  );
}
