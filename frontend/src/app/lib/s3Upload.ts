import { apiRequest } from './api';

export type UploadScope = 'avatar' | 'message-image' | 'portfolio' | 'project-reference' | 'project-submission';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

interface PresignResponse {
  key: string;
  uploadUrl: string;
  downloadUrl: string | null;
  expiresIn: number;
}

interface DirectUploadResponse {
  key: string;
  downloadUrl: string | null;
}

export interface UploadedFileRef {
  key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Gagal membaca file upload'));
  reader.readAsDataURL(file);
});

const delay = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Upload file via backend direct endpoint (base64 data URL in JSON body).
 * Works with or without S3 — falls back to local storage when S3 is not configured.
 */
async function uploadFileViaBackend(file: File, scope: UploadScope): Promise<UploadedFileRef> {
  const dataUrl = await fileToDataUrl(file);

  const response = await apiRequest<DirectUploadResponse>('/uploads/direct', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      scope,
      dataUrl,
    }),
  });

  return {
    key: response.key,
    url: response.downloadUrl || URL.createObjectURL(file),
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };
}

/**
 * Upload file via S3 presigned URL.
 * Returns null if S3 is not configured or the upload fails.
 */
async function uploadFileViaS3Presign(file: File, scope: UploadScope): Promise<UploadedFileRef | null> {
  try {
    const presign = await apiRequest<PresignResponse>('/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        scope,
      }),
    });

    const uploadResponse = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      console.warn(`[upload] S3 PUT returned status ${uploadResponse.status}`);
      return null;
    }

    return {
      key: presign.key,
      url: presign.downloadUrl || URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    };
  } catch (error) {
    console.warn('[upload] S3 presign upload failed, will use direct upload:', error);
    return null;
  }
}

/**
 * Upload file with retry logic.
 * Tries the given upload function up to (1 + MAX_RETRIES) times.
 */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        console.warn(`[upload] ${label} attempt ${attempt + 1} failed, retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Upload gagal: ${label}`);
}

/**
 * Main upload function.
 * Strategy:
 *  1. Try S3 presign + PUT (fastest when S3 is configured)
 *  2. Fall back to backend direct upload with retry
 *  3. For small files (avatar/message-image), fall back to inline data URL
 */
export async function uploadFileToS3(file: File, scope: UploadScope): Promise<UploadedFileRef> {
  // Step 1: Try S3 presign upload (fast path)
  const s3Result = await uploadFileViaS3Presign(file, scope);
  if (s3Result) return s3Result;

  // Step 2: Direct upload via backend with retry
  try {
    return await withRetry(() => uploadFileViaBackend(file, scope), 'direct-upload');
  } catch (directError) {
    const directMessage = directError instanceof Error ? directError.message : String(directError);
    console.warn('[upload] Direct upload also failed:', directMessage);

    // Step 3: Inline data URL fallback for small files (avatar, message image)
    if (scope === 'avatar' || scope === 'message-image') {
      try {
        const dataUrl = await fileToDataUrl(file);
        return {
          key: dataUrl,
          url: dataUrl,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        };
      } catch {
        // data URL fallback also failed
      }
    }

    // All attempts failed — provide a clear error message
    if (directMessage.includes('Failed to fetch') || directMessage.includes('fetch')) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan dan koneksi internet stabil.');
    }
    throw directError instanceof Error ? directError : new Error('Gagal mengupload file');
  }
}
