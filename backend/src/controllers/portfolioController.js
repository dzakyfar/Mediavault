const prisma = require('../config/prisma');
const { PORTFOLIO_MAX_ITEMS, validatePortfolioMediaFiles } = require('../utils/uploadLimits');
const { resolvePortfolioMedia } = require('../utils/mediaUrls');

const serializePortfolioItem = async (item) => resolvePortfolioMedia({
  id: item.id,
  title: item.title,
  category: item.category,
  serviceType: item.serviceType,
  description: item.description,
  fileUrl: item.fileUrl,
  fileName: item.fileName,
  fileType: item.fileType,
  fileSize: item.fileSize,
  media: item.media || [],
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const portfolioInclude = {
  media: { orderBy: { sortOrder: 'asc' } },
};

const normalizeMediaFiles = ({ files, fileUrl, fileName, fileType, fileSize }) => {
  const incomingFiles = Array.isArray(files) ? files : [];
  if (incomingFiles.length > 0) {
    return incomingFiles
      .filter((file) => file?.fileUrl)
      .map((file, index) => ({
        fileUrl: file.fileUrl,
        fileName: file.fileName || null,
        fileType: file.fileType || null,
        fileSize: Number.isFinite(Number(file.fileSize)) ? Number(file.fileSize) : null,
        sortOrder: index,
      }));
  }

  if (!fileUrl) return [];

  return [{
    fileUrl,
    fileName: fileName || null,
    fileType: fileType || null,
    fileSize: Number.isFinite(Number(fileSize)) ? Number(fileSize) : null,
    sortOrder: 0,
  }];
};

exports.listMyPortfolio = async (req, res, next) => {
  try {
    const items = await prisma.portfolioItem.findMany({
      where: { freelancerId: req.user.id },
      include: portfolioInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ items: await Promise.all(items.map(serializePortfolioItem)) });
  } catch (error) {
    next(error);
  }
};

exports.createPortfolioItem = async (req, res, next) => {
  try {
    const { title, category, serviceType, description, fileUrl, fileName, fileType, fileSize, files } = req.body;

    if (!title?.trim()) {
      res.status(400);
      throw new Error('Judul portfolio wajib diisi');
    }

    // Enforce max 5 items total
    const existingCount = await prisma.portfolioItem.count({
      where: { freelancerId: req.user.id },
    });
    if (existingCount >= PORTFOLIO_MAX_ITEMS) {
      res.status(400);
      throw new Error(`Maksimal ${PORTFOLIO_MAX_ITEMS} item portfolio`);
    }

    const mediaFiles = normalizeMediaFiles({ files, fileUrl, fileName, fileType, fileSize });
    const mediaError = validatePortfolioMediaFiles(mediaFiles);

    if (mediaError) {
      res.status(400);
      throw new Error(mediaError);
    }

    const item = await prisma.portfolioItem.create({
      data: {
        freelancerId: req.user.id,
        title: title.trim(),
        category: category || null,
        serviceType: serviceType || null,
        description: description || null,
        fileUrl: mediaFiles[0]?.fileUrl || null,
        fileName: mediaFiles[0]?.fileName || null,
        fileType: mediaFiles[0]?.fileType || null,
        fileSize: mediaFiles[0]?.fileSize ?? null,
        media: mediaFiles.length ? { create: mediaFiles } : undefined,
      },
      include: portfolioInclude,
    });

    res.status(201).json({ item: await serializePortfolioItem(item) });
  } catch (error) {
    next(error);
  }
};

exports.updatePortfolioItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, serviceType, description, fileUrl, fileName, fileType, fileSize, files } = req.body;

    const existing = await prisma.portfolioItem.findFirst({
      where: { id, freelancerId: req.user.id },
    });

    if (!existing) {
      res.status(404);
      throw new Error('Portfolio tidak ditemukan');
    }

    const mediaFiles = files !== undefined
      ? normalizeMediaFiles({ files, fileUrl, fileName, fileType, fileSize })
      : null;
    const mediaError = mediaFiles ? validatePortfolioMediaFiles(mediaFiles) : null;

    if (mediaError) {
      res.status(400);
      throw new Error(mediaError);
    }

    const item = await prisma.portfolioItem.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        category: category ?? undefined,
        serviceType: serviceType ?? undefined,
        description: description ?? undefined,
        ...(mediaFiles ? {
          fileUrl: mediaFiles[0]?.fileUrl || null,
          fileName: mediaFiles[0]?.fileName || null,
          fileType: mediaFiles[0]?.fileType || null,
          fileSize: mediaFiles[0]?.fileSize ?? null,
          media: {
            deleteMany: {},
            create: mediaFiles,
          },
        } : {}),
      },
      include: portfolioInclude,
    });

    res.json({ item: await serializePortfolioItem(item) });
  } catch (error) {
    next(error);
  }
};

exports.deletePortfolioItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.portfolioItem.findFirst({
      where: { id, freelancerId: req.user.id },
    });

    if (!existing) {
      res.status(404);
      throw new Error('Portfolio tidak ditemukan');
    }

    await prisma.portfolioItem.delete({ where: { id } });
    res.json({ message: 'Portfolio berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
