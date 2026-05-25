const prisma = require('../config/prisma');
const { formatCurrency, shortName } = require('../utils/formatters');
const { resolveMediaUrl, resolvePortfolioMedia } = require('../utils/mediaUrls');

exports.listFreelancers = async (req, res, next) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: {
        role: { in: ['FREELANCER', 'BOTH'] },
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
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        email: true,
        specialty: true,
        city: true,
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
          },
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

    const services = (freelancer.specialty || 'Photography')
      .split(/[|,]/)
      .map((service) => service.trim())
      .filter(Boolean);

    res.json({
      freelancer: {
        id: freelancer.id,
        name: shortName(freelancer.fullName),
        fullName: freelancer.fullName,
        avatarUrl: await resolveMediaUrl(freelancer.avatarUrl),
        specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
        services: services.length ? services : ['Photography'],
        bio: freelancer.bio || 'Freelancer ini belum menulis bio, tetapi profile tetap bisa dihubungi.',
        rating: reviewStats._avg.rating ? reviewStats._avg.rating.toFixed(1) : null,
        reviewCount: reviewStats._count.id,
        price: formatCurrency(freelancer.startingPrice || 0),
        city: freelancer.city || '-',
        available: freelancer.isAvailable,
        portfolioItems: await Promise.all(freelancer.portfolioItems.map(resolvePortfolioMedia)),
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
      serviceType,
      title,
      description,
      budget,
      eventDate,
      deadline,
      province,
      city,
      district,
      village,
      postalCode,
      address,
      addressDetail,
    } = req.body;

    if (!serviceType || !title || !description || !eventDate || !deadline || !city || !address) {
      res.status(400);
      throw new Error('Jasa, judul, deskripsi, tanggal, kota, dan alamat wajib diisi');
    }

    const freelancer = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        role: { in: ['FREELANCER', 'BOTH'] },
      },
      select: { id: true, fullName: true },
    });

    if (!freelancer) {
      res.status(404);
      throw new Error('Freelancer tidak ditemukan');
    }

    if (freelancer.id === req.user.id) {
      res.status(400);
      throw new Error('Tidak bisa memesan jasa dari akun sendiri');
    }

    const amount = Number(budget);
    const project = await prisma.project.create({
      data: {
        title,
        description,
        category: serviceType,
        serviceType,
        province,
        budget: Number.isFinite(amount) ? Math.round(amount) : null,
        eventDate: new Date(eventDate),
        deadline: new Date(deadline),
        city,
        district,
        village,
        postalCode,
        address: address || [addressDetail, village, district, city, province, postalCode].filter(Boolean).join(', '),
        addressDetail,
        status: 'UNDER_REVIEW',
        clientId: req.user.id,
        freelancerId: freelancer.id,
      },
    });

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: freelancer.id,
          type: 'PROJECT',
          title: 'Pesanan jasa baru',
          body: `${req.user.fullName} ingin memesan jasa ${serviceType}`,
        },
      }),
      prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: freelancer.id,
          body: `Saya ingin memesan jasa ${serviceType}: ${title}. ${description}`,
        },
      }),
      prisma.projectHistory.create({
        data: {
          projectId: project.id,
          actorId: req.user.id,
          title: 'Pesanan jasa dibuat',
          body: `${req.user.fullName} memesan jasa ${serviceType} ke ${freelancer.fullName}`,
          eventType: 'DIRECT_ORDER_CREATED',
        },
      }),
    ]);

    res.status(201).json({ projectId: project.id });
  } catch (error) {
    next(error);
  }
};
