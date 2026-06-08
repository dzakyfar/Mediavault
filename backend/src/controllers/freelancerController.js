const prisma = require('../config/prisma');
const { formatCurrency, shortName } = require('../utils/formatters');
const { resolveMediaUrl, resolvePortfolioMedia } = require('../utils/mediaUrls');
const { serializeOffering } = require('./offeringController');
const { notifyUser } = require('../services/notificationService');

const parseMoney = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = typeof value === 'string' ? value.replace(/[^\d]/g, '') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const countCharacters = (value = '') => String(value).length;

const parseRequiredDate = (value, label) => {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} wajib diisi dengan tanggal valid`);
  }
  return parsed;
};

const startOfTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

exports.listFreelancers = async (req, res, next) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: {
        role: { in: ['FREELANCER', 'BOTH'] },
        AND: [
          { bio: { not: null } },
          { bio: { not: '' } },
          { specialty: { not: null } },
          { specialty: { not: '' } },
          { startingPrice: { not: null } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        specialty: true,
        city: true,
        startingPrice: true,
        isAvailable: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    const reviewStats = freelancers.length
      ? await prisma.freelancerReview.groupBy({
        by: ['freelancerId'],
        where: { freelancerId: { in: freelancers.map((freelancer) => freelancer.id) } },
        _avg: { rating: true },
        _count: { id: true },
      })
      : [];

    const reviewMap = new Map(reviewStats.map((stat) => [stat.freelancerId, stat]));

    res.json({
      freelancers: await Promise.all(freelancers.map(async (freelancer) => {
        const stat = reviewMap.get(freelancer.id);

        return {
          id: freelancer.id,
          name: shortName(freelancer.fullName),
          fullName: freelancer.fullName,
          avatarUrl: await resolveMediaUrl(freelancer.avatarUrl),
          specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
          rating: stat?._avg.rating ? stat._avg.rating.toFixed(1) : null,
          reviewCount: stat?._count.id || 0,
          price: formatCurrency(freelancer.startingPrice || 0),
          city: freelancer.city || '-',
          available: freelancer.isAvailable,
        };
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getFreelancerById = async (req, res, next) => {
  try {
    const freelancer = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        role: { in: ['FREELANCER', 'BOTH'] },
        AND: [
          { bio: { not: null } },
          { bio: { not: '' } },
          { specialty: { not: null } },
          { specialty: { not: '' } },
          { startingPrice: { not: null } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        email: true,
        specialty: true,
        city: true,
        province: true,
        district: true,
        village: true,
        postalCode: true,
        addressDetail: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        bio: true,
        startingPrice: true,
        isAvailable: true,
        portfolioItems: {
          select: {
            id: true,
            title: true,
            category: true,
            serviceType: true,
            description: true,
            fileUrl: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            media: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        offerings: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!freelancer) {
      res.status(404);
      throw new Error('Freelancer tidak ditemukan');
    }

    const [reviewStats, reviews] = await Promise.all([
      prisma.freelancerReview.aggregate({
        where: { freelancerId: freelancer.id },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.freelancerReview.findMany({
        where: { freelancerId: freelancer.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const offeringServices = freelancer.offerings
      .map((offering) => offering.serviceType || offering.title)
      .filter(Boolean);
    const fallbackServices = (freelancer.specialty || '')
      .split(/[|,]/)
      .map((service) => service.trim())
      .filter(Boolean);
    const services = [...new Set([...(offeringServices.length ? offeringServices : fallbackServices)])];
    const offeringTags = freelancer.offerings.flatMap((offering) => [
      offering.serviceType || offering.title,
      ...(offering.relatedSpecs || []),
    ]).filter(Boolean);
    const serviceTags = [...new Set(offeringTags.length ? offeringTags : services)];
    const maxTeamCapacity = freelancer.offerings.reduce(
      (max, offering) => Math.max(max, offering.capacityPersons || 1),
      1
    );

    res.json({
      freelancer: {
        id: freelancer.id,
        name: shortName(freelancer.fullName),
        fullName: freelancer.fullName,
        avatarUrl: await resolveMediaUrl(freelancer.avatarUrl),
        specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
        services,
        serviceTags,
        maxTeamCapacity,
        bio: freelancer.bio || 'Freelancer ini belum menulis bio, tetapi profile tetap bisa dihubungi.',
        rating: reviewStats._avg.rating ? reviewStats._avg.rating.toFixed(1) : null,
        reviewCount: reviewStats._count.id,
        price: formatCurrency(freelancer.startingPrice || 0),
        city: freelancer.city || '-',
        province: freelancer.province,
        district: freelancer.district,
        village: freelancer.village,
        postalCode: freelancer.postalCode,
        addressDetail: freelancer.addressDetail,
        latitude: freelancer.latitude,
        longitude: freelancer.longitude,
        locationSource: freelancer.locationSource,
        available: freelancer.isAvailable,
        portfolioItems: await Promise.all(freelancer.portfolioItems.map(resolvePortfolioMedia)),
        offerings: freelancer.offerings.map(serializeOffering),
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.orderFreelancerService = async (req, res, next) => {
  try {
    const {
      offeringId,
      serviceType,
      needType,
      title,
      description,
      budget,
      personsCount,
      latitude,
      longitude,
      locationSource,
      eventDate,
      deadline,
      province,
      city,
      district,
      village,
      postalCode,
      address,
      addressDetail,
      costBreakdown,
    } = req.body;

    if (!serviceType || !needType || !description || !eventDate || !deadline || !province || !city || !district || !village || !addressDetail) {
      res.status(400);
      throw new Error('Jasa, kebutuhan, deskripsi, tanggal, dan alamat lengkap wajib diisi');
    }

    const freelancer = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        role: { in: ['FREELANCER', 'BOTH'] },
      },
      include: {
        offerings: {
          where: { isActive: true },
        },
      },
    });

    if (!freelancer) {
      res.status(404);
      throw new Error('Freelancer tidak ditemukan');
    }

    if (freelancer.id === req.user.id) {
      res.status(400);
      throw new Error('Tidak bisa memesan jasa dari akun sendiri');
    }

    const selectedOffering = offeringId
      ? freelancer.offerings.find((offering) => offering.id === offeringId)
      : freelancer.offerings.find((offering) => (offering.serviceType || offering.title) === serviceType);
    if (freelancer.offerings.length > 0 && !selectedOffering) {
      res.status(400);
      throw new Error('Jenis jasa tidak tersedia di profile freelancer ini');
    }
    const normalizedServiceType = selectedOffering?.serviceType || serviceType;
    const normalizedNeedType = selectedOffering?.title || needType;

    if (countCharacters(title || `${normalizedServiceType} - ${normalizedNeedType}`) > 64) {
      res.status(400);
      throw new Error('Judul pekerjaan maksimal 64 karakter');
    }

    if (countCharacters(description) > 500) {
      res.status(400);
      throw new Error('Deskripsi maksimal 500 karakter');
    }

    let parsedEventDate;
    let parsedDeadline;
    try {
      parsedEventDate = parseRequiredDate(eventDate, 'Tanggal pelaksanaan');
      parsedDeadline = parseRequiredDate(deadline, 'Deadline');
    } catch (validationError) {
      res.status(400);
      throw validationError;
    }

    if (parsedDeadline < startOfTomorrow()) {
      res.status(400);
      throw new Error('Deadline minimal H+1');
    }

    const amount = parseMoney(budget);
    if (!amount || amount < 10000) {
      res.status(400);
      throw new Error('Budget minimal Rp 10.000');
    }

    const composedAddress = [addressDetail, village, district, city, province, postalCode].filter(Boolean).join(', ');
    const project = await prisma.project.create({
      data: {
        title: title || `${normalizedServiceType} - ${normalizedNeedType}`,
        description,
        category: normalizedServiceType,
        serviceType: normalizedServiceType,
        province,
        budget: amount,
        eventDate: parsedEventDate,
        deadline: parsedDeadline,
        city,
        district,
        village,
        postalCode,
        address: address || composedAddress,
        addressDetail,
        latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
        longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
        locationSource: locationSource || 'manual',
        status: 'WAITING_PAYMENT',
        progress: 20,
        clientId: req.user.id,
        freelancerId: freelancer.id,
      },
    });

    await Promise.all([
      notifyUser({
        userId: freelancer.id,
        type: 'PROJECT',
        title: 'Pesanan jasa baru menunggu pembayaran',
        body: `${req.user.fullName} ingin memesan jasa ${normalizedServiceType}. Project menunggu pembayaran QRIS.`,
        actionPath: `/dashboard/freelancer/projects/${project.id}`,
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: freelancer.id,
          body: `Saya ingin memesan jasa ${normalizedServiceType}: ${normalizedNeedType}. ${description}`,
        },
      }),
      prisma.projectHistory.create({
        data: {
          projectId: project.id,
          actorId: req.user.id,
          title: 'Pesanan jasa dibuat',
          body: `${req.user.fullName} memesan jasa ${normalizedServiceType} ke ${freelancer.fullName} dan perlu menyelesaikan pembayaran QRIS.`,
          eventType: 'DIRECT_ORDER_CREATED',
        },
      }),
      costBreakdown ? prisma.projectHistory.create({
        data: {
          projectId: project.id,
          actorId: req.user.id,
          title: 'Snapshot biaya pesanan',
          body: JSON.stringify(costBreakdown),
          eventType: 'ORDER_COST_BREAKDOWN',
        },
      }) : Promise.resolve(null),
    ]);

    res.status(201).json({ projectId: project.id });
  } catch (error) {
    next(error);
  }
};
