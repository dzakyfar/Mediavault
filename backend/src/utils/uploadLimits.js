const MB = 1024 * 1024;
const GB = 1024 * MB;

const MESSAGE_IMAGE_MAX_BYTES = 1 * MB;
const PROJECT_SUBMISSION_MAX_BYTES = 1 * MB;
const REFERENCE_FILE_MAX_BYTES = 100 * MB;
const S3_TOTAL_LIMIT_BYTES = 5 * GB;
const ALLOWED_INLINE_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const ALLOWED_SUBMISSION_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

const dataUrlSizeInBytes = (dataUrl = '') => {
  const base64 = String(dataUrl).split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
};

const validateInlineImage = ({ imageUrl, imageMime, imageSize }) => {
  if (!imageUrl) return null;

  if (!ALLOWED_INLINE_IMAGE_TYPES.includes(imageMime)) {
    return 'Gambar harus berformat PNG atau JPEG';
  }

  const actualSize = Number(imageSize) || dataUrlSizeInBytes(imageUrl);
  if (actualSize > MESSAGE_IMAGE_MAX_BYTES) {
    return 'Ukuran gambar maksimal 1MB';
  }

  if (!String(imageUrl).startsWith(`data:${imageMime};base64,`)) {
    return 'Format gambar tidak valid';
  }

  return null;
};

const validateSubmissionFile = ({ fileUrl, fileType, fileSize }) => {
  if (!fileUrl) return 'File bukti wajib diupload';

  if (!ALLOWED_SUBMISSION_FILE_TYPES.includes(fileType)) {
    return 'File bukti harus berupa PNG, JPEG, atau PDF';
  }

  const actualSize = Number(fileSize) || dataUrlSizeInBytes(fileUrl);
  if (actualSize > PROJECT_SUBMISSION_MAX_BYTES) {
    return 'Ukuran file bukti maksimal 1MB untuk mode local saat ini';
  }

  if (!String(fileUrl).startsWith(`data:${fileType};base64,`)) {
    return 'Format file bukti tidak valid';
  }

  return null;
};

const validateReferenceFiles = (files = []) => {
  if (!Array.isArray(files)) return 'Reference files tidak valid';

  const totalSize = files.reduce((total, file) => total + (Number(file.fileSize) || 0), 0);
  if (totalSize > S3_TOTAL_LIMIT_BYTES) {
    return 'Total file melebihi limit bucket 5GB';
  }

  const oversized = files.find((file) => Number(file.fileSize) > REFERENCE_FILE_MAX_BYTES);
  if (oversized) {
    return `File ${oversized.fileName || 'reference'} melebihi batas 100MB`;
  }

  return null;
};

module.exports = {
  ALLOWED_INLINE_IMAGE_TYPES,
  ALLOWED_SUBMISSION_FILE_TYPES,
  MESSAGE_IMAGE_MAX_BYTES,
  PROJECT_SUBMISSION_MAX_BYTES,
  REFERENCE_FILE_MAX_BYTES,
  S3_TOTAL_LIMIT_BYTES,
  validateInlineImage,
  validateSubmissionFile,
  validateReferenceFiles,
};
