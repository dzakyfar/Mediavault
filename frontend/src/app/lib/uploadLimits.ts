export const MB = 1024 * 1024;
export const GB = 1024 * MB;

export const MESSAGE_IMAGE_MAX_BYTES = 1 * MB;
export const PROJECT_SUBMISSION_MAX_BYTES = 500 * MB;
export const REFERENCE_FILE_MAX_BYTES = 100 * MB;
export const S3_TOTAL_LIMIT_BYTES = 5 * GB;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
export const ALLOWED_SUBMISSION_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm'];

export function formatBytes(bytes: number) {
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)}GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export function validateImageFile(file: File, maxBytes = MESSAGE_IMAGE_MAX_BYTES) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'File harus berupa PNG atau JPEG';
  }

  if (file.size > maxBytes) {
    return `Ukuran file maksimal ${formatBytes(maxBytes)}`;
  }

  return '';
}

export function validateSubmissionFile(file: File, maxBytes = PROJECT_SUBMISSION_MAX_BYTES) {
  if (!ALLOWED_SUBMISSION_TYPES.includes(file.type)) {
    return 'File harus berupa PNG, JPEG, PDF, MP4, MOV, atau WebM';
  }

  if (file.size > maxBytes) {
    return `Ukuran file maksimal ${formatBytes(maxBytes)}`;
  }

  return '';
}

export function validateReferenceFile(file: File, maxBytes = REFERENCE_FILE_MAX_BYTES) {
  if (file.size > maxBytes) {
    return `Ukuran reference file maksimal ${formatBytes(maxBytes)}`;
  }

  return '';
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}
