import { apiRequest } from './api';

export type UploadScope = 'avatar' | 'message-image' | 'portfolio' | 'project-reference' | 'project-submission';

interface PresignResponse {
  key: string;
  uploadUrl: string;
  downloadUrl: string | null;
  expiresIn: number;
}

export interface UploadedFileRef {
  key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function uploadFileToS3(file: File, scope: UploadScope): Promise<UploadedFileRef> {
  const presign = await apiRequest<PresignResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      scope,
    }),
  });

  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    throw new Error(`Gagal upload file ke S3. Cek CORS bucket, region, dan koneksi. Detail: ${message}`);
  }

  if (!uploadResponse.ok) {
    const responseText = await uploadResponse.text().catch(() => '');
    const detail = responseText ? ` Detail: ${responseText.slice(0, 180)}` : '';
    throw new Error(`Gagal upload file ke S3 (${uploadResponse.status}).${detail}`);
  }

  return {
    key: presign.key,
    url: presign.downloadUrl || URL.createObjectURL(file),
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };
}
