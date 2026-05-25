const path = require('path');
const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION;
const endpoint = process.env.AWS_S3_ENDPOINT || undefined;
const forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === 'true';

const s3Client = bucket && region
  ? new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
      : undefined,
  })
  : null;

const allowedScopes = new Set([
  'avatar',
  'message-image',
  'portfolio',
  'project-reference',
  'project-submission',
]);

const isS3Configured = () => Boolean(s3Client && bucket);

const sanitizeFileName = (fileName = 'file') => {
  const ext = path.extname(fileName).slice(0, 20).replace(/[^a-zA-Z0-9.]/g, '');
  const base = path.basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'file';

  return `${base}${ext}`;
};

const createObjectKey = ({ scope, userId, fileName }) => {
  if (!allowedScopes.has(scope)) {
    throw new Error('Scope upload tidak valid');
  }

  const safeName = sanitizeFileName(fileName);
  const today = new Date().toISOString().slice(0, 10);
  return `uploads/${scope}/${userId}/${today}/${randomUUID()}-${safeName}`;
};

const isS3ObjectKey = (value) => {
  if (!value || typeof value !== 'string') return false;
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) return false;
  return value.startsWith('uploads/') && !value.includes('..') && !value.includes('\\');
};

const createPresignedUpload = async ({ key, contentType }) => {
  if (!isS3Configured()) {
    throw new Error('S3 belum dikonfigurasi di backend');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });

  return getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
};

const createPresignedDownload = async (key) => {
  if (!isS3ObjectKey(key)) return key || null;

  if (!isS3Configured()) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 60 * 15 });
};

module.exports = {
  allowedScopes,
  createObjectKey,
  createPresignedDownload,
  createPresignedUpload,
  isS3Configured,
  isS3ObjectKey,
};
