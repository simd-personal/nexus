'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  FileText,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { createProject } from '@/lib/actions/projects';
import { AI_EMPLOYEE_NAME, APP_NAME } from '@/lib/constants';
import {
  PROJECT_SUBJECT_HINT,
  PROJECT_SUBJECT_LABEL,
  PROJECT_SUBJECT_PLACEHOLDER,
} from '@/lib/onboarding/copy';
import { ONBOARDING_SAMPLE_MEETING_NOTES } from '@/lib/onboarding/sample-content';
import type { OnboardingStep } from '@/lib/onboarding/status';
import {
  getStageHelperText,
  onboardingProcessingSubtitle,
  PROCESSING_BACKGROUND_NOTE,
} from '@/lib/processing/user-messages';
import {
  formatUploadApiError,
  UPLOAD_MAX_SIZE_HINT,
} from '@/lib/upload/user-messages';
import {
  getFilesFromDataTransfer,
  isFileDragEvent,
  kickFileProcessing,
  uploadProjectFiles,
  UPLOAD_ACCEPT,
} from '@/lib/upload/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UpperDeckIcon } from '@/components/brand/UpperDeckLogo';
import type { ProjectWithStats } from '@/types/database';

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: 'project', label: 'Your project' },
  { id: 'upload', label: 'Add files' },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [projectState, setProjectState] = useState(project);
  const [fileId, setFileId] = useState<string | null>(activeFileId);
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [progressLabel, setProgressLabel] = useState('Queued for processing…');
  const [progressPercent, setProgressPercent] = useState(0);
  const [sizeHint, setSizeHint] = useState<string | null>(null);
  const [progressHelper, setProgressHelper] = useState<string | null>(null);

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

  /** Optional background poll — never blocks the user from continuing. */
  useEffect(() => {
    if ((step !== 'processing' && step !== 'complete') || !fileId || !projectState) return;

    let cancelled = false;

    async function poll() {
      for (let attempt = 0; attempt < 45; attempt++) {
        if (cancelled) return;

        const response = await fetch(`/api/files/${fileId}/process`, { cache: 'no-store' });
        if (response.ok) {
          const data = (await response.json()) as {
            status: string;
            progress?: { label?: string; percent?: number };
          };

          if (step === 'processing') {
            const label = data.progress?.label ?? 'Sunny is reading…';
            setProgressLabel(label);
            setProgressPercent(data.progress?.percent ?? Math.min(90, 10 + attempt * 2));
            setProgressHelper(getStageHelperText(undefined, { label }));
          }

          if (['processed', 'watch', 'critical'].includes(data.status)) {
            const nextSummary = await pollProjectSummary(projectState!.id);
            if (!cancelled && nextSummary) {
              setSummary(nextSummary);
            }
            return;
          }

          if (data.status === 'failed' && step === 'processing' && uploadedNames.length <= 1) {
            if (!cancelled) {
              setError(
                'This file could not be processed. You can continue to your project and tap Reprocess on the Files tab to try again.'
              );
            }
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [step, fileId, projectState, pollProjectSummary, uploadedNames.length]);

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
        setError(formatUploadApiError(response.status, data));
        setLoading(false);
        return;
      }

      const uploadedId = data.data?.id as string | undefined;
      if (uploadedId) {
        kickFileProcessing(uploadedId);
        setUploadedNames(['Sample meeting notes']);
        setFileId(uploadedId);
        setStep('processing');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFilesSelected(files: File[]) {
    if (!files.length || !projectState) return;

    setLoading(true);
    setError('');

    const { uploaded, fileIds, errors, sizeHint: uploadSizeHint, zipExtracted } =
      await uploadProjectFiles(projectState.id, files);

    if (uploaded.length === 0) {
      setError(errors[0] ?? 'Upload failed');
      setLoading(false);
      return;
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    const displayNames = zipExtracted
      ? [`${fileIds.length} file${fileIds.length !== 1 ? 's' : ''} extracted from zip`]
      : uploaded;

    setUploadedNames(displayNames);
    setFileId(fileIds[0] ?? null);
    setStep('processing');
    setProgressLabel(
      zipExtracted
        ? `Unpacking and reading ${fileIds.length} files…`
        : fileIds.length === 1
          ? 'Sunny is reading your file…'
          : `Sunny is reading ${fileIds.length} files…`
    );
    setSizeHint(uploadSizeHint);
    setProgressPercent(8);
    setLoading(false);
    router.refresh();
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    void handleFilesSelected(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void handleFilesSelected(getFilesFromDataTransfer(e.dataTransfer));
  }

  function continueToProject() {
    setStep('complete');
    setError('');
    if (projectState) {
      void pollProjectSummary(projectState.id).then((next) => {
        if (next) setSummary(next);
      });
    }
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
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
            Getting started
          </p>
          <h1 className="app-page-title text-2xl">
            Onboard {AI_EMPLOYEE_NAME} in three steps
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
                  ? 'border-[var(--brand-accent)] bg-[rgba(37,99,235,0.08)] text-[var(--brand-accent-dark)] dark:border-[var(--brand-accent)] dark:bg-[rgba(37,99,235,0.15)]'
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
            Step 1 · Set up your first project
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{PROJECT_SUBJECT_HINT}</p>

          <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
            <Field
              label={PROJECT_SUBJECT_LABEL}
              name="client_name"
              placeholder={PROJECT_SUBJECT_PLACEHOLDER}
              required
            />
            <Field
              label="What are you working on?"
              name="project_name"
              placeholder="e.g. Q3 board prep, discovery phase, v2 launch"
              required
            />
            <Field
              label={`What should ${AI_EMPLOYEE_NAME} watch for? (optional)`}
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
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--brand-accent)]">{projectLabel}</p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 2 · Add files for {AI_EMPLOYEE_NAME} to read
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Upload one file, many files, a whole folder, or a zip archive. {UPLOAD_MAX_SIZE_HINT}.
            {PROCESSING_BACKGROUND_NOTE}
          </p>

          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging
                ? 'border-[var(--brand-accent)] bg-[rgba(37,99,235,0.05)] dark:bg-[rgba(37,99,235,0.12)]'
                : 'border-gray-200 dark:border-[var(--ud-cloud)]'
            }`}
          >
            <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Drag files or a folder here
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              PDF, DOCX, TXT, email, transcript, image, audio, spreadsheets
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderOpen className="h-4 w-4" />
                Choose folder
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={UPLOAD_ACCEPT}
              onChange={handleFileInput}
              disabled={loading}
            />
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              multiple
              {...({ webkitdirectory: 'true', directory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>)}
              onChange={handleFileInput}
              disabled={loading}
            />
          </div>

          {loading && (
            <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-300">
              Uploading…
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              loading={loading}
              onClick={() => uploadContent(ONBOARDING_SAMPLE_MEETING_NOTES, 'meeting')}
              className="flex-1 justify-center"
            >
              <FileText className="h-4 w-4" />
              Try sample meeting notes instead
            </Button>
          </div>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <SunnyAvatar size="xl" className="animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Step 3 · {AI_EMPLOYEE_NAME} is on it
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{progressLabel}</p>

          {uploadedNames.length > 0 && (
            <ul className="mx-auto mt-4 max-w-md space-y-1 text-left text-xs text-gray-600 dark:text-gray-300">
              {uploadedNames.slice(0, 6).map((name) => (
                <li key={name} className="truncate rounded-md bg-gray-50 px-3 py-1.5 dark:bg-[var(--ud-cloud)]">
                  {name}
                </li>
              ))}
              {uploadedNames.length > 6 && (
                <li className="px-3 py-1 text-gray-500">+ {uploadedNames.length - 6} more</li>
              )}
            </ul>
          )}

          <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-gray-100 dark:bg-[var(--ud-cloud)]">
            <div
              className="h-full rounded-full bg-[image:var(--ud-gradient)] transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, 8)}%` }}
            />
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {onboardingProcessingSubtitle(uploadedNames.length)}
          </p>

          {sizeHint && (
            <p className="mx-auto mt-3 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {sizeHint}
            </p>
          )}

          {progressHelper && (
            <p className="mx-auto mt-3 max-w-md text-xs text-gray-500 dark:text-gray-400">
              {progressHelper}
            </p>
          )}

          <Button type="button" className="mt-6" onClick={continueToProject}>
            Continue — processing runs in background
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {PROCESSING_BACKGROUND_NOTE} Check the Overview for Sunny&apos;s brief when it&apos;s ready.
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
                {uploadedNames.length > 1
                  ? `${uploadedNames.length} files are queued for ${projectState.project_name}. Sunny will keep indexing in the background.`
                  : `${projectLabel} is ready in ${APP_NAME}. Ask questions, search materials, or review critical items — every answer cites your files.`}
              </p>
            </div>
          </div>

          {summary && (
            <div className="mt-6 rounded-lg border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.05)] p-4 dark:border-[rgba(37,99,235,0.3)] dark:bg-[rgba(37,99,235,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
                First brief excerpt
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                {summary.length > 420 ? `${summary.slice(0, 420).trim()}…` : summary}
              </p>
            </div>
          )}

          {!summary && uploadedNames.length > 0 && (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Sunny is still reading your files in the background. Your brief will appear on the
              project Overview when the first batch finishes — usually within a few minutes.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href={`/projects/${projectState.id}/overview`} className="sm:flex-1">
              <Button className="w-full justify-center">
                View project
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/projects/${projectState.id}/files`} className="sm:flex-1">
              <Button variant="secondary" className="w-full justify-center">
                See upload progress
              </Button>
            </Link>
            <Link href={`/projects/${projectState.id}/ask-sunny`}>
              <Button variant="ghost" className="w-full justify-center sm:w-auto">
                Ask {AI_EMPLOYEE_NAME}
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
    'w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100';

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
