export type UploadProgressDetail = {
  count: number;
  names: string[];
};

export const UPLOAD_PROGRESS_START = 'project-files-uploading-start';
export const UPLOAD_PROGRESS_END = 'project-files-uploading-end';

export function notifyUploadStart(files: Pick<File, 'name'>[]) {
  if (typeof window === 'undefined' || files.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<UploadProgressDetail>(UPLOAD_PROGRESS_START, {
      detail: {
        count: files.length,
        names: files.map((file) => file.name),
      },
    })
  );
}

export function notifyUploadEnd() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(UPLOAD_PROGRESS_END));
}
