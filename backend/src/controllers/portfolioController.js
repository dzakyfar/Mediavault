const prisma = require('../config/prisma');
const { validateInlineImage } = require('../utils/uploadLimits');

const serializePortfolioItem = (item) => ({
  id: item.id,
  title: item.title,
  category: item.category,
  serviceType: item.serviceType,
  description: item.description,
  fileUrl: item.fileUrl,
  fileName: item.fileName,
  fileType: item.fileType,
  fileSize: item.fileSize,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

exports.listMyPortfolio = async (req, res, next) => {
  try {
    const items = await prisma.portfolioItem.findMany({
      where: { freelancerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ items: items.map(serializePortfolioItem) });
  } catch (error) {
    next(error);
  }
};

exports.createPortfolioItem = async (req, res, next) => {
  try {
    const { title, category, serviceType, description, fileUrl, fileName, fileType, fileSize } = req.body;

    if (!title?.trim()) {
      res.status(400);
      throw new Error('Judul portfolio wajib diisi');
    }

    const imageError = fileUrl ? validateInlineImage({
      imageUrl: fileUrl,
      imageMime: fileType,
      imageSize: fileSize,
    }) : null;

    if (imageError) {
      res.status(400);
      throw new Error(imageError);
    }

    const item = await prisma.portfolioItem.create({
      data: {
        freelancerId: req.user.id,
        title: title.trim(),
        category: category || null,
        serviceType: serviceType || null,
        description: description || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: Number.isFinite(Number(fileSize)) ? Number(fileSize) : null,
      },
    });

    res.status(201).json({ item: serializePortfolioItem(item) });
  } catch (error) {
    next(error);
  }
};

exports.updatePortfolioItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, serviceType, description, fileUrl, fileName, fileType, fileSize } = req.body;

    const existing = await prisma.portfolioItem.findFirst({
      where: { id, freelancerId: req.user.id },
    });

    if (!existing) {
      res.status(404);
      throw new Error('Portfolio tidak ditemukan');
    }

    const imageError = fileUrl ? validateInlineImage({
      imageUrl: fileUrl,
      imageMime: fileType,
      imageSize: fileSize,
    }) : null;

    if (imageError) {
      res.status(400);
      throw new Error(imageError);
    }

    const item = await prisma.portfolioItem.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        category: category ?? undefined,
        serviceType: serviceType ?? undefined,
        description: description ?? undefined,
        fileUrl: fileUrl ?? undefined,
        fileName: fileName ?? undefined,
        fileType: fileType ?? undefined,
        fileSize: fileSize === undefined ? undefined : Number(fileSize),
      },
    });

    res.json({ item: serializePortfolioItem(item) });
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
