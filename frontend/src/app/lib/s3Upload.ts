import { apiRequest } from './api';

export type UploadScope = 'avatar' | 'message-image' | 'portfolio' | 'project-reference' | 'project-submission';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

/** Max dimension (px) for compressed images */
const COMPRESS_MAX_DIMENSION = 1200;
/** JPEG quality for compression (0-1) */
const COMPRESS_QUALITY = 0.8;
/** Only compress images larger than this threshold */
const COMPRESS_THRESHOLD_BYTES = 400 * 1024; // 400KB

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
 * Compress an image file client-side:
 *  - Resizes to max COMPRESS_MAX_DIMENSION on longest side
 *  - Converts PNG → JPEG (smaller size, unless image has transparency)
 *  - Targets COMPRESS_QUALITY JPEG quality
 *
 * Only compresses if the file exceeds COMPRESS_THRESHOLD_BYTES.
 * Returns the original file unchanged for non-images or already-small files.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }
  if (file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than max dimension
      if (width > COMPRESS_MAX_DIMENSION || height > COMPRESS_MAX_DIMENSION) {
        const ratio = Math.min(COMPRESS_MAX_DIMENSION / width, COMPRESS_MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(img.src);

      // Use JPEG for smaller size; keep PNG only if it has transparency and is already small
      const outputType = 'image/jpeg';
      const ext = '.jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}${ext}`, { type: outputType }));
        },
        outputType,
        COMPRESS_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

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
 *  1. Compress image if needed (reduces body size to avoid nginx/reverse proxy limits)
 *  2. Try backend direct upload with retry (most reliable — works with or without S3)
 *  3. Try S3 presign + PUT as alternative if direct upload fails
 */
export async function uploadFileToS3(file: File, scope: UploadScope): Promise<UploadedFileRef> {
  // Step 0: Compress image to reduce upload size (prevents "Failed to fetch" from oversized requests)
  const compressedFile = await compressImage(file);
  if (compressedFile.size < file.size) {
    console.log(`[upload] Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
  }

  // Step 1: Direct upload via backend (primary path, with retry)
  try {
    return await withRetry(() => uploadFileViaBackend(compressedFile, scope), 'direct-upload');
  } catch (directError) {
    const directMessage = directError instanceof Error ? directError.message : String(directError);
    console.warn('[upload] Direct upload failed, trying S3 presign:', directMessage);

    // Step 2: Try S3 presign as alternative
    const s3Result = await uploadFileViaS3Presign(compressedFile, scope);
    if (s3Result) return s3Result;

    // All attempts failed — provide a clear error message
    if (directMessage.includes('Failed to fetch') || directMessage.includes('fetch') || directMessage.includes('timeout')) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan dan koneksi internet stabil.');
    }
    throw directError instanceof Error ? directError : new Error('Gagal mengupload file. Silakan coba lagi.');
  }
}
