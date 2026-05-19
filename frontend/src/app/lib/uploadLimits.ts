export const MB = 1024 * 1024;
export const GB = 1024 * MB;

export const MESSAGE_IMAGE_MAX_BYTES = 1 * MB;
export const S3_TOTAL_LIMIT_BYTES = 5 * GB;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

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

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}
