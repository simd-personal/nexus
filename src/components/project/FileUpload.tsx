'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Mail, StickyNote, Mic } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  isFileDragEvent,
  uploadProjectFiles,
  kickFileProcessing,
  UPLOAD_ACCEPT,
} from '@/lib/upload/client';

interface FileUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
}

export function FileUploadCenter({ projectId, onUploadComplete }: FileUploadProps) {
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteMode, setPasteMode] = useState<'email' | 'meeting' | 'transcript' | 'note' | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState('');

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) {
      setMessage('Error: No files selected.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const { uploaded, errors } = await uploadProjectFiles(projectId, files);

      if (uploaded.length > 0) {
        setMessage(
          uploaded.length === 1
            ? `${uploaded[0]} uploaded — Sunny is processing...`
            : `${uploaded.length} files uploaded — Sunny is processing...`
        );
        onUploadComplete?.();
        window.dispatchEvent(new CustomEvent('project-files-uploaded'));
      }

      if (errors.length > 0) {
        setMessage(`Error: ${errors[0]}`);
      }
    } catch {
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [projectId, onUploadComplete]);

  const uploadPastedText = useCallback(async () => {
    if (!pasteText.trim() || !pasteMode) return;
    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('pasted_text', pasteText);
    formData.append('pasted_type', pasteMode);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        redirect: 'manual',
      });
      const contentType = res.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : { error: res.status === 401 ? 'Please sign in again.' : 'Upload failed' };
      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage('Content uploaded — Sunny is processing...');
        setPasteText('');
        setPasteMode(null);
        onUploadComplete?.();
        if (data.data?.id) {
          kickFileProcessing(data.data.id);
        }
      }
    } catch {
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [projectId, pasteText, pasteMode, onUploadComplete]);

  function handleDragEnter(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setDragging(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    void handleFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Upload Center"
          description="Drop files anywhere on this project or paste content for Sunny to process"
        />

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
            dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200'
          )}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drag and drop files here
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Any file type works. Sunny fully processes .txt, .md, .pdf, .docx, .csv, images, transcripts, audio, and .eml.
          </p>
          <label className="inline-block cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept={UPLOAD_ACCEPT}
            />
            <span className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm px-3 py-1.5 text-xs">
              {uploading ? 'Uploading...' : 'Browse files'}
            </span>
          </label>
        </div>

        {message && (
          <p className={cn('text-sm mt-3', message.startsWith('Error') ? 'text-red-600' : 'text-emerald-600')}>
            {message}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Paste Content" description="Paste emails, meeting notes, or transcripts" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <PasteButton icon={Mail} label="Email" active={pasteMode === 'email'} onClick={() => setPasteMode('email')} />
          <PasteButton icon={StickyNote} label="Meeting Notes" active={pasteMode === 'meeting'} onClick={() => setPasteMode('meeting')} />
          <PasteButton icon={Mic} label="Transcript" active={pasteMode === 'transcript'} onClick={() => setPasteMode('transcript')} />
          <PasteButton icon={FileText} label="Note" active={pasteMode === 'note'} onClick={() => setPasteMode('note')} />
        </div>

        {pasteMode && (
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Paste your ${pasteMode.replace('_', ' ')} content here...`}
              className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={uploadPastedText} loading={uploading} disabled={!pasteText.trim()}>
                Upload to Sunny
              </Button>
              <Button variant="ghost" onClick={() => { setPasteMode(null); setPasteText(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PasteButton({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-colors',
        active ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
