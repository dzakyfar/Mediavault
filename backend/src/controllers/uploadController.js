const {
  MESSAGE_IMAGE_MAX_BYTES,
  PORTFOLIO_IMAGE_MAX_BYTES,
  PORTFOLIO_VIDEO_MAX_BYTES,
  ALLOWED_PORTFOLIO_TYPES,
  PROJECT_SUBMISSION_MAX_BYTES,
  REFERENCE_FILE_MAX_BYTES,
  S3_TOTAL_LIMIT_BYTES,
  ALLOWED_INLINE_IMAGE_TYPES,
  ALLOWED_SUBMISSION_FILE_TYPES,
} = require('../utils/uploadLimits');
const {
  createObjectKey,
  createPresignedDownload,
  createPresignedUpload,
  isS3Configured,
  isS3ObjectKey,
  uploadLocalObject,
  uploadObject,
} = require('../utils/s3Storage');

const scopeConfig = {
  avatar: {
    maxBytes: MESSAGE_IMAGE_MAX_BYTES,
    allowedTypes: ALLOWED_INLINE_IMAGE_TYPES,
  },
  'message-image': {
    maxBytes: MESSAGE_IMAGE_MAX_BYTES,
    allowedTypes: ALLOWED_INLINE_IMAGE_TYPES,
  },
  portfolio: {
    // Limit per-file: gambar 1MB, video 100MB. Kuota per portfolio divalidasi saat item disimpan.
    maxBytes: PORTFOLIO_VIDEO_MAX_BYTES,
    allowedTypes: ALLOWED_PORTFOLIO_TYPES,
  },
  'project-reference': {
    maxBytes: REFERENCE_FILE_MAX_BYTES,
    allowedTypes: null,
  },
  'project-submission': {
    maxBytes: PROJECT_SUBMISSION_MAX_BYTES,
    allowedTypes: ALLOWED_SUBMISSION_FILE_TYPES,
  },
};

const maxBytesForUpload = (scope, fileType, config) => (
  scope === 'portfolio' && String(fileType).startsWith('image/')
    ? PORTFOLIO_IMAGE_MAX_BYTES
    : config.maxBytes
);

exports.createUploadUrl = async (req, res, next) => {
  try {
    if (!isS3Configured()) {
      res.status(503);
      throw new Error('S3 belum dikonfigurasi. Isi AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, dan AWS_SECRET_ACCESS_KEY.');
    }

    const { fileName, fileType, fileSize, scope } = req.body;
    const config = scopeConfig[scope];

    if (!config) {
      res.status(400);
      throw new Error('Scope upload tidak valid');
    }

    if (!fileName || !fileType || !Number.isFinite(Number(fileSize))) {
      res.status(400);
      throw new Error('Nama file, tipe file, dan ukuran file wajib dikirim');
    }

    const maxBytes = maxBytesForUpload(scope, fileType, config);
    if (Number(fileSize) > maxBytes) {
      res.status(400);
      throw new Error(`Ukuran file melebihi batas ${Math.round(maxBytes / 1024 / 1024)}MB`);
    }

    if (Number(fileSize) > S3_TOTAL_LIMIT_BYTES) {
      res.status(400);
      throw new Error('Ukuran file melebihi limit bucket 5GB');
    }

    if (config.allowedTypes && !config.allowedTypes.includes(fileType)) {
      res.status(400);
      throw new Error('Tipe file tidak didukung untuk upload ini');
    }

    const key = createObjectKey({
      scope,
      userId: req.user.id,
      fileName,
    });
    const uploadUrl = await createPresignedUpload({ key, contentType: fileType });
    const downloadUrl = await createPresignedDownload(key);

    res.json({
      key,
      uploadUrl,
      downloadUrl,
      expiresIn: 300,
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadDirect = async (req, res, next) => {
  try {
    const { fileName, fileType, fileSize, scope, dataUrl } = req.body;
    const config = scopeConfig[scope];

    if (!config) {
      res.status(400);
      throw new Error('Scope upload tidak valid');
    }

    if (!fileName || !fileType || !Number.isFinite(Number(fileSize)) || !dataUrl) {
      res.status(400);
      throw new Error('Nama file, tipe file, ukuran file, dan data file wajib dikirim');
    }

    const maxBytes = maxBytesForUpload(scope, fileType, config);
    if (Number(fileSize) > maxBytes) {
      res.status(400);
      throw new Error(`Ukuran file melebihi batas ${Math.round(maxBytes / 1024 / 1024)}MB`);
    }

    if (Number(fileSize) > S3_TOTAL_LIMIT_BYTES) {
      res.status(400);
      throw new Error('Ukuran file melebihi limit bucket 5GB');
    }

    if (config.allowedTypes && !config.allowedTypes.includes(fileType)) {
      res.status(400);
      throw new Error('Tipe file tidak didukung untuk upload ini');
    }

    const expectedPrefix = `data:${fileType};base64,`;
    if (!String(dataUrl).startsWith(expectedPrefix)) {
      res.status(400);
      throw new Error('Format data file tidak valid');
    }

    const base64 = String(dataUrl).slice(expectedPrefix.length);
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length > maxBytes || buffer.length > S3_TOTAL_LIMIT_BYTES) {
      res.status(400);
      throw new Error('Ukuran file tidak valid');
    }

    const key = createObjectKey({
      scope,
      userId: req.user.id,
      fileName,
    });

    let downloadUrl;
    if (isS3Configured()) {
      await uploadObject({ key, body: buffer, contentType: fileType });
      downloadUrl = await createPresignedDownload(key);
    } else {
      await uploadLocalObject({ key, body: buffer, contentType: fileType });
      const publicPath = key.replace(/^uploads\//, '');
      downloadUrl = `${req.protocol}://${req.get('host')}/uploads-local/${publicPath}`;
    }

    res.status(201).json({
      key,
      downloadUrl,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDownloadUrl = async (req, res, next) => {
  try {
    const { key } = req.query;

    if (!isS3ObjectKey(key)) {
      res.status(400);
      throw new Error('S3 key tidak valid');
    }

    const downloadUrl = await createPresignedDownload(key);
    if (!downloadUrl) {
      res.status(503);
      throw new Error('S3 belum dikonfigurasi');
    }

    res.json({ downloadUrl });
  } catch (error) {
    next(error);
  }
};
