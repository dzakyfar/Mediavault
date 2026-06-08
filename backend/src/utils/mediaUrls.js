const { createPresignedDownload, isS3ObjectKey } = require('./s3Storage');

const resolveMediaUrl = async (value) => {
  if (!value) return value;
  if (!isS3ObjectKey(value)) return value;
  return createPresignedDownload(value);
};

const resolveUserMedia = async (user) => {
  if (!user) return user;
  return {
    ...user,
    avatarUrl: await resolveMediaUrl(user.avatarUrl),
    avatarKey: isS3ObjectKey(user.avatarUrl) ? user.avatarUrl : null,
  };
};

const resolvePortfolioMedia = async (item) => {
  const resolvedMedia = await Promise.all((item.media || []).map(async (media) => ({
    ...media,
    fileUrl: await resolveMediaUrl(media.fileUrl),
    fileKey: isS3ObjectKey(media.fileUrl) ? media.fileUrl : null,
  })));
  const legacyMedia = !resolvedMedia.length && item.fileUrl
    ? [{
      id: `${item.id}-legacy`,
      portfolioItemId: item.id,
      fileUrl: await resolveMediaUrl(item.fileUrl),
      fileKey: isS3ObjectKey(item.fileUrl) ? item.fileUrl : null,
      fileName: item.fileName,
      fileType: item.fileType,
      fileSize: item.fileSize,
      sortOrder: 0,
    }]
    : [];

  return {
    ...item,
    fileUrl: await resolveMediaUrl(item.fileUrl),
    fileKey: isS3ObjectKey(item.fileUrl) ? item.fileUrl : null,
    media: resolvedMedia.length ? resolvedMedia : legacyMedia,
  };
};

const resolveProjectMedia = async (project) => ({
  ...project,
  submissions: await Promise.all((project.submissions || []).map(async (submission) => ({
    ...submission,
    fileUrl: await resolveMediaUrl(submission.fileUrl),
    fileKey: isS3ObjectKey(submission.fileUrl) ? submission.fileUrl : null,
  }))),
  referenceFiles: await Promise.all((project.referenceFiles || []).map(async (file) => ({
    ...file,
    fileUrl: await resolveMediaUrl(file.fileUrl),
    fileKey: isS3ObjectKey(file.fileUrl) ? file.fileUrl : null,
  }))),
});

const resolveMessageMedia = async (message) => ({
  ...message,
  imageUrl: await resolveMediaUrl(message.imageUrl),
  imageKey: isS3ObjectKey(message.imageUrl) ? message.imageUrl : null,
});

module.exports = {
  resolveMediaUrl,
  resolveMessageMedia,
  resolvePortfolioMedia,
  resolveProjectMedia,
  resolveUserMedia,
};
