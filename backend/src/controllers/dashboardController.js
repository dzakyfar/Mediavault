const prisma = require('../config/prisma');
const { formatCurrency, serializeProject, shortName } = require('../utils/formatters');
const { resolveMediaUrl } = require('../utils/mediaUrls');

const formatActivityTime = (date) => new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(date);

const buildRecentActivities = (histories = [], notifications = []) => [
  ...histories.map((history) => ({
    text: history.body || history.title,
    date: history.createdAt,
    source: 'history',
  })),
  ...notifications.map((notification) => ({
    text: notification.body || notification.title,
    date: notification.createdAt,
    source: 'notification',
  })),
]
  .sort((first, second) => new Date(second.date) - new Date(first.date))
  .slice(0, 8)
  .map((activity) => ({
    text: activity.text,
    time: formatActivityTime(activity.date),
    source: activity.source,
  }));

const CLIENT_ACTIVE_PROJECT_STATUSES = ['OPEN', 'IN_PROGRESS', 'CONFIRMED', 'UNDER_REVIEW', 'WAITING_PAYMENT'];
const FREELANCER_ACTIVE_PROJECT_STATUSES = ['IN_PROGRESS', 'CONFIRMED'];

exports.getClientDashboard = async (req, res, next) => {
  try {
    const [
      projects,
      unreadMessages,
      pendingInvoices,
      histories,
      notifications,
      freelancers,
      wallet,
      activeProjectCount,
      filesReady,
    ] = await Promise.all([
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
      prisma.notification.findMany({
        where: { userId: req.user.id, type: { not: 'MESSAGE' } },
        orderBy: { createdAt: 'desc' },
        take: 8,
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
      prisma.wallet.findUnique({ where: { userId: req.user.id } }),
      prisma.project.count({
        where: {
          clientId: req.user.id,
          status: { in: CLIENT_ACTIVE_PROJECT_STATUSES },
        },
      }),
      prisma.projectFile.count({
        where: {
          project: { clientId: req.user.id },
        },
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

    res.json({
      stats: {
        activeProjects: activeProjectCount,
        pendingPayment: formatCurrency(pendingInvoices._sum.amount || 0),
        filesReady,
        unreadMessages,
        walletBalance: formatCurrency(wallet?.balance || 0),
      },
      projects: projects.map(serializeProject),
      activities: buildRecentActivities(histories, notifications),
      recommendedFreelancers: await Promise.all(freelancers.map(async (freelancer) => {
        const stat = reviewMap.get(freelancer.id);

        return {
          id: freelancer.id,
          name: shortName(freelancer.fullName),
          avatarUrl: await resolveMediaUrl(freelancer.avatarUrl),
          specialty: freelancer.specialty || 'Belum mengisi spesialisasi',
          rating: stat?._avg.rating ? stat._avg.rating.toFixed(1) : null,
          reviewCount: stat?._count.id || 0,
          price: formatCurrency(freelancer.startingPrice || 0),
          available: freelancer.isAvailable,
        };
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getFreelancerDashboard = async (req, res, next) => {
  try {
    const openRequestWhere = {
      status: 'OPEN',
      clientId: { not: req.user.id },
      applications: {
        none: {
          freelancerId: req.user.id,
          status: 'PENDING',
        },
      },
    };

    const [
      projects,
      openRequests,
      unreadMessages,
      pendingInvoices,
      histories,
      notifications,
      wallet,
      reviewStats,
      completedProjects,
      activeProjectCount,
      openRequestCount,
    ] = await Promise.all([
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
        where: openRequestWhere,
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
        where: {
          OR: [
            { project: { freelancerId: req.user.id } },
            { actorId: req.user.id },
          ],
        },
        include: { project: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.notification.findMany({
        where: { userId: req.user.id, type: { not: 'MESSAGE' } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.wallet.findUnique({ where: { userId: req.user.id } }),
      prisma.freelancerReview.aggregate({
        where: { freelancerId: req.user.id },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.project.count({
        where: {
          freelancerId: req.user.id,
          status: 'COMPLETED',
        },
      }),
      prisma.project.count({
        where: {
          freelancerId: req.user.id,
          status: { in: FREELANCER_ACTIVE_PROJECT_STATUSES },
        },
      }),
      prisma.project.count({ where: openRequestWhere }),
    ]);

    res.json({
      stats: {
        activeProjects: activeProjectCount,
        pendingPayment: formatCurrency(pendingInvoices._sum.amount || 0),
        openRequests: openRequestCount,
        unreadMessages,
        walletBalance: formatCurrency(wallet?.balance || 0),
        averageRating: reviewStats._avg.rating ? reviewStats._avg.rating.toFixed(1) : null,
        reviewCount: reviewStats._count.id,
        completedProjects,
      },
      projects: projects.map(serializeProject),
      requests: openRequests.map(serializeProject),
      activities: buildRecentActivities(histories, notifications),
    });
  } catch (error) {
    next(error);
  }
};
