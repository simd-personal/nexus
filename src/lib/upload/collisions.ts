import {
  findProjectFileByUploadName,
  type ProjectFileSummary,
} from '@/lib/files/replace-content';
import {
  getClientUploadSizeHint,
  kickFileProcessing,
  replaceProjectFile,
  uploadProjectFile,
  type UploadFileResult,
} from '@/lib/upload/client';

export type UploadCollisionChoice = 'replace' | 'add' | 'cancel';

export type UploadCollisionPrompt = {
  file: File;
  existing: ProjectFileSummary;
};

export async function fetchProjectFileSummaries(projectId: string): Promise<ProjectFileSummary[]> {
  const res = await fetch(`/api/projects/${projectId}/files`, { credentials: 'same-origin' });
  if (!res.ok) return [];
  const data = (await res.json()) as { files?: ProjectFileSummary[] };
  return data.files ?? [];
}

export async function uploadProjectFilesWithCollisions(
  projectId: string,
  files: File[],
  options: {
    existingFiles?: ProjectFileSummary[];
    promptCollision: (collision: UploadCollisionPrompt) => Promise<UploadCollisionChoice>;
    userNote?: string;
  }
): Promise<{
  uploaded: string[];
  replaced: string[];
  fileIds: string[];
  errors: string[];
  sizeHint: string | null;
  zipExtracted: boolean;
  cancelled: boolean;
}> {
  const existingFiles = options.existingFiles ?? (await fetchProjectFileSummaries(projectId));
  const uploaded: string[] = [];
  const replaced: string[] = [];
  const fileIds: string[] = [];
  const errors: string[] = [];
  let zipExtracted = false;
  let cancelled = false;

  for (const file of files) {
    const existing = findProjectFileByUploadName(existingFiles, file.name);
    let choice: UploadCollisionChoice = 'add';

    if (existing) {
      choice = await options.promptCollision({ file, existing });
      if (choice === 'cancel') {
        cancelled = true;
        break;
      }
    }

    let result: UploadFileResult;
    if (choice === 'replace' && existing) {
      result = await replaceProjectFile(projectId, existing.id, file);
      if (result.ok) {
        replaced.push(file.name);
        if (result.fileId) {
          fileIds.push(result.fileId);
          kickFileProcessing(result.fileId, true);
        }
        existingFiles.splice(
          existingFiles.findIndex((entry) => entry.id === existing.id),
          1,
          { id: existing.id, file_name: file.name }
        );
      }
    } else {
      result = await uploadProjectFile(projectId, file, {
        userNote: options.userNote,
        trackProgress: false,
      });
      if (result.ok) {
        uploaded.push(file.name);
        if (result.fileIds?.length) {
          fileIds.push(...result.fileIds);
          for (const id of result.fileIds) kickFileProcessing(id);
        } else if (result.fileId) {
          fileIds.push(result.fileId);
          kickFileProcessing(result.fileId);
        }
        if (result.zipExtracted) zipExtracted = true;
        if (result.fileId) {
          existingFiles.push({ id: result.fileId, file_name: file.name });
        }
      }
    }

    if (!result.ok) {
      errors.push(`${file.name}: ${result.error ?? 'Upload failed'}`);
    }
  }

  const sizeHint = getClientUploadSizeHint(files);

  return { uploaded, replaced, fileIds, errors, sizeHint, zipExtracted, cancelled };
}
