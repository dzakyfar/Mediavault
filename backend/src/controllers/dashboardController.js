const prisma = require('../config/prisma');
const { formatCurrency, serializeProject, shortName } = require('../utils/formatters');

const formatActivityTime = (date) => new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(date);

exports.getClientDashboard = async (req, res, next) => {
  try {
    const [projects, unreadMessages, pendingInvoices, histories, freelancers] = await Promise.all([
      prisma.project.findMany({
        where: { clientId: req.user.id },
        include: {
          freelancer: { select: { fullName: true } },
          applications: {
            where: { status: 'PENDING' },
            include: {
              freelancer: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  specialty: true,
                  startingPrice: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { files: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.message.count({
        where: {
          receiverId: req.user.id,
          readAt: null,
        },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PENDING',
          project: { clientId: req.user.id },
        },
        _sum: { amount: true },
      }),
      prisma.projectHistory.findMany({
        where: { project: { clientId: req.user.id } },
        include: { project: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.user.findMany({
        where: {
          role: { in: ['FREELANCER', 'BOTH'] },
          id: { not: req.user.id },
        },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          specialty: true,
          startingPrice: true,
          isAvailable: true,
        },
        orderBy: [
          { isAvailable: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 4,
      }),
    ]);

    const reviewStats = freelancers.length
      ? await prisma.freelancerReview.groupBy({
        by: ['freelancerId'],
        where: { freelancerId: { in: freelancers.map((freelancer) => freelancer.id) } },
        _avg: { rating: true },
        _count: { id: true },
      })
      : [];
    const reviewMap = new Map(reviewStats.map((stat) => [stat.freelancerId, stat]));

    const activeProjects = projects.filter((project) =>
      ['OPEN', 'IN_PROGRESS', 'CONFIRMED', 'UNDER_REVIEW', 'WAITING_PAYMENT'].includes(project.status)
    );

    const filesReady = projects.reduce((total, project) => total + project._count.files, 0);

    res.json({
      stats: {
        activeProjects: activeProjects.length,
        pendingPayment: formatCurrency(pendingInvoices._sum.amount || 0),
        filesReady,
        unreadMessages,
      },
      projects: projects.map(serializeProject),
      activities: histories.map((history) => ({
        text: history.body || history.title,
        time: formatActivityTime(history.createdAt),
      })),
      recommendedFreelancers: freelancers.map((freelancer) => {
        const stat = reviewMap.get(freelancer.id);

        return {
          id: freelancer.id,
          name: shortName(freelancer.fullName),
          avatarUrl: freelancer.avatarUrl,
          specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
          rating: stat?._avg.rating ? stat._avg.rating.toFixed(1) : null,
          reviewCount: stat?._count.id || 0,
          price: formatCurrency(freelancer.startingPrice || 0),
          available: freelancer.isAvailable,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

exports.getFreelancerDashboard = async (req, res, next) => {
  try {
    const [projects, openRequests, unreadMessages, pendingInvoices, histories] = await Promise.all([
      prisma.project.findMany({
        where: { freelancerId: req.user.id },
        include: {
          client: { select: { fullName: true } },
          applications: {
            where: { status: 'PENDING' },
            include: {
              freelancer: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  specialty: true,
                  startingPrice: true,
                },
              },
            },
          },
          _count: { select: { files: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          status: 'OPEN',
          clientId: { not: req.user.id },
        },
        include: {
          client: { select: { fullName: true } },
          applications: {
            where: { status: 'PENDING' },
            include: {
              freelancer: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  specialty: true,
                  startingPrice: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.message.count({
        where: {
          receiverId: req.user.id,
          readAt: null,
        },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PENDING',
          project: { freelancerId: req.user.id },
        },
        _sum: { amount: true },
      }),
      prisma.projectHistory.findMany({
        where: { project: { freelancerId: req.user.id } },
        include: { project: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    res.json({
      stats: {
        activeProjects: projects.filter((project) => ['IN_PROGRESS', 'CONFIRMED'].includes(project.status)).length,
        pendingPayment: formatCurrency(pendingInvoices._sum.amount || 0),
        openRequests: openRequests.length,
        unreadMessages,
      },
      projects: projects.map(serializeProject),
      requests: openRequests.map(serializeProject),
      activities: histories.map((history) => ({
        text: history.body || history.title,
        time: formatActivityTime(history.createdAt),
      })),
    });
  } catch (error) {
    next(error);
  }
};
