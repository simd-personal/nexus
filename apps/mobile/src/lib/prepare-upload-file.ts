import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/** Stay under typical serverless request body limits (~4.5 MB on Vercel). */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type PreparedUploadFile = {
  uri: string;
  fileName: string;
  mimeType: string;
};

function ensureJpegName(fileName: string): string {
  const base = fileName.replace(/\.(heic|heif|png|webp|jpe?g)$/i, '') || `photo-${Date.now()}`;
  return `${base}.jpg`;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return 0;
  return typeof info.size === 'number' ? info.size : 0;
}

async function compressImage(uri: string, width: number, compress: number): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    { compress, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function prepareUploadFile(
  uri: string,
  fileName: string,
  mimeType: string
): Promise<PreparedUploadFile> {
  const sourceInfo = await FileSystem.getInfoAsync(uri);
  if (!sourceInfo.exists) {
    throw new Error('Could not read that file. Try capturing or selecting it again.');
  }

  if (!isImageMime(mimeType)) {
    const size = await getFileSize(uri);
    if (size === 0) {
      throw new Error('That file appears empty. Try selecting it again.');
    }
    if (size > MAX_UPLOAD_BYTES) {
      throw new Error('File is too large (max 4 MB for mobile upload).');
    }
    return { uri, fileName, mimeType };
  }

  let preparedUri = await compressImage(uri, 2048, 0.85);
  let size = await getFileSize(preparedUri);

  if (size === 0) {
    throw new Error('Could not prepare the photo. Try taking it again.');
  }

  if (size > MAX_UPLOAD_BYTES) {
    preparedUri = await compressImage(uri, 1600, 0.72);
    size = await getFileSize(preparedUri);
  }

  if (size === 0) {
    throw new Error('Could not prepare the photo. Try taking it again.');
  }

  if (size > MAX_UPLOAD_BYTES) {
    preparedUri = await compressImage(uri, 1280, 0.65);
    size = await getFileSize(preparedUri);
  }

  if (size > MAX_UPLOAD_BYTES) {
    throw new Error('Photo is too large after compression. Try a closer shot or lower resolution.');
  }

  return {
    uri: preparedUri,
    fileName: ensureJpegName(fileName),
    mimeType: 'image/jpeg',
  };
}
