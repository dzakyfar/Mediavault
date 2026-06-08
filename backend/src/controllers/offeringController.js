const prisma = require('../config/prisma');
const { formatCurrency } = require('../utils/formatters');

const parseList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const serializeOffering = (offering) => ({
  id: offering.id,
  freelancerId: offering.freelancerId,
  title: offering.title,
  serviceType: offering.serviceType || offering.title,
  price: offering.price,
  priceFormatted: formatCurrency(offering.price),
  ratePerHour: offering.ratePerHour || offering.price,
  ratePerHourFormatted: formatCurrency(offering.ratePerHour || offering.price),
  ratePerPhoto: offering.ratePerPhoto,
  ratePerPhotoFormatted: offering.ratePerPhoto ? formatCurrency(offering.ratePerPhoto) : null,
  extraPersonFee: offering.extraPersonFee || 0,
  extraPersonFeeFormatted: formatCurrency(offering.extraPersonFee || 0),
  estimatedHours: offering.estimatedHours || 2,
  description: offering.description,
  benefits: offering.benefits || [],
  toolsSpec: offering.toolsSpec,
  capacityPersons: offering.capacityPersons,
  relatedSpecs: offering.relatedSpecs || [],
  isActive: offering.isActive,
  createdAt: offering.createdAt,
  updatedAt: offering.updatedAt,
});

exports.listMyOfferings = async (req, res, next) => {
  try {
    const offerings = await prisma.offering.findMany({
      where: { freelancerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ offerings: offerings.map(serializeOffering) });
  } catch (error) {
    next(error);
  }
};

exports.createOffering = async (req, res, next) => {
  try {
    const {
      title,
      serviceType,
      price,
      ratePerHour,
      ratePerPhoto,
      extraPersonFee,
      estimatedHours,
      description,
      benefits,
      toolsSpec,
      capacityPersons,
      relatedSpecs,
    } = req.body;

    const normalizedRatePerHour = Math.round(Number(ratePerHour || price));
    const normalizedRatePerPhoto = ratePerPhoto === undefined || ratePerPhoto === ''
      ? null
      : Math.round(Number(ratePerPhoto));
    const normalizedExtraPersonFee = Math.round(Number(extraPersonFee || 0));
    const normalizedEstimatedHours = Math.max(1, Math.round(Number(estimatedHours || 2)));
    const normalizedPrice = Math.round(Number(price || normalizedRatePerHour));
    if (!title?.trim()) {
      res.status(400);
      throw new Error('Judul paket wajib diisi');
    }

    if (!serviceType?.trim()) {
      res.status(400);
      throw new Error('Jenis jasa wajib diisi');
    }

    if (!Number.isFinite(normalizedRatePerHour) || normalizedRatePerHour < 1) {
      res.status(400);
      throw new Error('Harga per jam minimal Rp 1');
    }

    const parsedBenefits = parseList(benefits || description);
    if (!description?.trim() && parsedBenefits.length === 0) {
      res.status(400);
      throw new Error('Deskripsi atau benefit paket wajib diisi');
    }

    const offering = await prisma.offering.create({
      data: {
        freelancerId: req.user.id,
        title: title.trim(),
        serviceType: serviceType.trim(),
        price: normalizedPrice,
        ratePerHour: normalizedRatePerHour,
        ratePerPhoto: Number.isFinite(normalizedRatePerPhoto) ? normalizedRatePerPhoto : null,
        extraPersonFee: Number.isFinite(normalizedExtraPersonFee) ? normalizedExtraPersonFee : 0,
        estimatedHours: normalizedEstimatedHours,
        description: description?.trim() || null,
        benefits: parsedBenefits,
        toolsSpec: toolsSpec?.trim() || null,
        capacityPersons: Number.isFinite(Number(capacityPersons)) ? Math.round(Number(capacityPersons)) : null,
        relatedSpecs: parseList(relatedSpecs),
      },
    });

    res.status(201).json({ offering: serializeOffering(offering) });
  } catch (error) {
    next(error);
  }
};

exports.updateOffering = async (req, res, next) => {
  try {
    const existing = await prisma.offering.findFirst({
      where: { id: req.params.id, freelancerId: req.user.id },
    });

    if (!existing) {
      res.status(404);
      throw new Error('Paket tidak ditemukan');
    }

    const data = {};
    if (req.body.title !== undefined) data.title = String(req.body.title).trim();
    if (req.body.serviceType !== undefined) data.serviceType = String(req.body.serviceType).trim();
    if (req.body.price !== undefined) {
      const normalizedPrice = Math.round(Number(req.body.price));
      if (!Number.isFinite(normalizedPrice) || normalizedPrice < 1) {
        res.status(400);
        throw new Error('Harga paket minimal Rp 1');
      }
      data.price = normalizedPrice;
    }
    if (req.body.ratePerHour !== undefined) {
      const normalizedRatePerHour = Math.round(Number(req.body.ratePerHour));
      if (!Number.isFinite(normalizedRatePerHour) || normalizedRatePerHour < 1) {
        res.status(400);
        throw new Error('Harga per jam minimal Rp 1');
      }
      data.ratePerHour = normalizedRatePerHour;
      if (req.body.price === undefined) data.price = normalizedRatePerHour;
    }
    if (req.body.ratePerPhoto !== undefined) {
      data.ratePerPhoto = req.body.ratePerPhoto === '' || req.body.ratePerPhoto === null
        ? null
        : Math.round(Number(req.body.ratePerPhoto));
    }
    if (req.body.extraPersonFee !== undefined) {
      data.extraPersonFee = Math.max(0, Math.round(Number(req.body.extraPersonFee || 0)));
    }
    if (req.body.estimatedHours !== undefined) {
      data.estimatedHours = Math.max(1, Math.round(Number(req.body.estimatedHours || 1)));
    }
    if (req.body.description !== undefined) data.description = req.body.description?.trim() || null;
    if (req.body.benefits !== undefined) data.benefits = parseList(req.body.benefits);
    if (req.body.toolsSpec !== undefined) data.toolsSpec = req.body.toolsSpec?.trim() || null;
    if (req.body.capacityPersons !== undefined) {
      data.capacityPersons = Number.isFinite(Number(req.body.capacityPersons))
        ? Math.round(Number(req.body.capacityPersons))
        : null;
    }
    if (req.body.relatedSpecs !== undefined) data.relatedSpecs = parseList(req.body.relatedSpecs);
    if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);

    const offering = await prisma.offering.update({
      where: { id: existing.id },
      data,
    });

    res.json({ offering: serializeOffering(offering) });
  } catch (error) {
    next(error);
  }
};

exports.deleteOffering = async (req, res, next) => {
  try {
    const existing = await prisma.offering.findFirst({
      where: { id: req.params.id, freelancerId: req.user.id },
    });

    if (!existing) {
      res.status(404);
      throw new Error('Paket tidak ditemukan');
    }

    await prisma.offering.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    res.json({ message: 'Paket dinonaktifkan' });
  } catch (error) {
    next(error);
  }
};

exports.serializeOffering = serializeOffering;
