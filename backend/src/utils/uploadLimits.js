const MB = 1024 * 1024;
const GB = 1024 * MB;

const MESSAGE_IMAGE_MAX_BYTES = 1 * MB;
const S3_TOTAL_LIMIT_BYTES = 5 * GB;
const ALLOWED_INLINE_IMAGE_TYPES = ['image/png', 'image/jpeg'];

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

module.exports = {
  ALLOWED_INLINE_IMAGE_TYPES,
  MESSAGE_IMAGE_MAX_BYTES,
  S3_TOTAL_LIMIT_BYTES,
  validateInlineImage,
};
