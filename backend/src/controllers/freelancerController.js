const prisma = require('../config/prisma');
const { formatCurrency, shortName } = require('../utils/formatters');

exports.listFreelancers = async (req, res, next) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: {
        role: { in: ['FREELANCER', 'BOTH'] },
      },
      select: {
        id: true,
        fullName: true,
        specialty: true,
        city: true,
        startingPrice: true,
        isAvailable: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    res.json({
      freelancers: freelancers.map((freelancer) => ({
        id: freelancer.id,
        name: shortName(freelancer.fullName),
        fullName: freelancer.fullName,
        specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
        rating: null,
        price: formatCurrency(freelancer.startingPrice || 0),
        city: freelancer.city || '-',
        available: freelancer.isAvailable,
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

    const services = (freelancer.specialty || 'Photography')
      .split(/[|,]/)
      .map((service) => service.trim())
      .filter(Boolean);

    res.json({
      freelancer: {
        id: freelancer.id,
        name: shortName(freelancer.fullName),
        fullName: freelancer.fullName,
        specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
        services: services.length ? services : ['Photography'],
        bio: freelancer.bio || 'Freelancer ini belum menulis bio, tetapi profile tetap bisa dihubungi.',
        rating: null,
        price: formatCurrency(freelancer.startingPrice || 0),
        city: freelancer.city || '-',
        available: freelancer.isAvailable,
        portfolioItems: freelancer.portfolioItems,
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
