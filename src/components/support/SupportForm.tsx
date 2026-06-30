'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { submitSupportRequest, type SupportFormState } from '@/lib/actions/support';
import type { SupportRequestCategory } from '@/lib/email/templates';
import {
  isSupportImageContentType,
  isSupportImageFileName,
  MAX_SUPPORT_ATTACHMENT_BYTES,
  SUPPORT_IMAGE_ACCEPT,
} from '@/lib/support/attachment';

const INITIAL_STATE: SupportFormState = { status: 'idle', message: '' };

const CATEGORY_OPTIONS: Array<{ value: SupportRequestCategory; label: string; hint: string }> = [
  {
    value: 'feedback',
    label: 'Feedback',
    hint: 'Tell us what is working well or what could be smoother.',
  },
  {
    value: 'idea',
    label: 'Product idea',
    hint: 'Suggest a feature or improvement you would like to see.',
  },
  {
    value: 'bug',
    label: 'Bug report',
    hint: 'Something broken? We usually fix these within 24–48 hours.',
  },
];

interface SupportFormProps {
  email: string;
  fullName: string;
}

function validateScreenshotFile(file: File): string | null {
  if (!isSupportImageContentType(file.type) && !isSupportImageFileName(file.name)) {
    return 'Screenshots must be an image (PNG, JPG, WEBP, GIF, or HEIC).';
  }
  if (file.size > MAX_SUPPORT_ATTACHMENT_BYTES) {
    return 'Screenshot is too large (max 5 MB). Try compressing the image and upload again.';
  }
  return null;
}

export function SupportForm({ email, fullName }: SupportFormProps) {
  const [state, formAction, pending] = useActionState(submitSupportRequest, INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearScreenshot() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFileName(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleScreenshotChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      clearScreenshot();
      return;
    }

    const error = validateScreenshotFile(file);
    if (error) {
      setFileError(error);
      setSelectedFileName(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      event.target.value = '';
      return;
    }

    setFileError(null);
    setSelectedFileName(file.name);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={fullName || '—'}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          What would you like to share?
        </legend>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors has-[:checked]:border-[var(--brand-accent)] has-[:checked]:bg-[rgba(37,99,235,0.04)] dark:border-[var(--ud-cloud)] dark:has-[:checked]:bg-[rgba(37,99,235,0.12)]"
            >
              <input
                type="radio"
                name="category"
                value={option.value}
                defaultChecked={option.value === 'feedback'}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-accent)]"
                required
              />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          id="support-message"
          name="message"
          rows={6}
          required
          placeholder="Share as much detail as you can — for bugs, include what you expected and what happened instead."
          className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
        />
      </div>

      <div>
        <label htmlFor="support-screenshot" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Screenshot or photo <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
        </label>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Attach a screenshot if it helps us understand a bug or idea. PNG, JPG, WEBP, or GIF up to 5 MB.
        </p>
        {!previewUrl ? (
          <label
            htmlFor="support-screenshot"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 transition-colors hover:border-[var(--brand-accent)] hover:bg-[rgba(37,99,235,0.03)] dark:border-[var(--ud-cloud)] dark:text-gray-300 dark:hover:bg-[rgba(37,99,235,0.08)]"
          >
            <ImagePlus className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
            <span>Choose an image from your device</span>
          </label>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedFileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Attached to your support request</p>
              </div>
              <button
                type="button"
                onClick={clearScreenshot}
                className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-[var(--ud-mist)] dark:hover:text-gray-200"
                aria-label="Remove screenshot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={previewUrl}
              alt="Screenshot preview"
              className="max-h-64 w-full rounded-lg border border-gray-200 bg-white object-contain dark:border-[var(--ud-cloud)]"
            />
          </div>
        )}
        <input
          ref={fileInputRef}
          id="support-screenshot"
          name="screenshot"
          type="file"
          accept={SUPPORT_IMAGE_ACCEPT}
          className="sr-only"
          onChange={handleScreenshotChange}
        />
        {fileError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" aria-live="polite">
            {fileError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending} disabled={Boolean(fileError)}>
          {pending ? 'Sending…' : 'Send to support'}
        </Button>
        {state.status !== 'idle' && (
          <p
            aria-live="polite"
            className={`text-sm ${state.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
