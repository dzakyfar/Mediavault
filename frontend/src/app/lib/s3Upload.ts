import { apiRequest } from './api';

export type UploadScope = 'avatar' | 'message-image' | 'portfolio' | 'project-reference' | 'project-submission';
const BACKEND_DIRECT_FALLBACK_MAX_BYTES = 100 * 1024 * 1024;

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

async function uploadFileViaBackend(file: File, scope: UploadScope): Promise<UploadedFileRef> {
  const response = await apiRequest<DirectUploadResponse>('/uploads/direct', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      scope,
      dataUrl: await fileToDataUrl(file),
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

export async function uploadFileToS3(file: File, scope: UploadScope): Promise<UploadedFileRef> {
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
      throw new Error(`S3 direct upload failed with status ${uploadResponse.status}`);
    }

    return {
      key: presign.key,
      url: presign.downloadUrl || URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    };
  } catch (error) {
    if (file.size > BACKEND_DIRECT_FALLBACK_MAX_BYTES) {
      throw error instanceof Error ? error : new Error('Gagal upload file ke S3');
    }

    return uploadFileViaBackend(file, scope);
  }
}
