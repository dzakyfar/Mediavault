const prisma = require('../config/prisma');
const { formatCurrency, serializeProject } = require('../utils/formatters');

exports.getClientDashboard = async (req, res, next) => {
  try {
    const [projects, unreadMessages, pendingInvoices] = await Promise.all([
      prisma.project.findMany({
        where: { clientId: req.user.id },
        include: {
          freelancer: { select: { fullName: true } },
          applications: {
            where: { status: 'PENDING' },
            include: { freelancer: { select: { fullName: true } } },
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
    ]);

    const activeProjects = projects.filter((project) =>
      ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'WAITING_PAYMENT'].includes(project.status)
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
      activities: [],
      recommendedFreelancers: [],
    });
  } catch (error) {
    next(error);
  }
};

exports.getFreelancerDashboard = async (req, res, next) => {
  try {
    const [projects, openRequests, unreadMessages, pendingInvoices] = await Promise.all([
      prisma.project.findMany({
        where: { freelancerId: req.user.id },
        include: {
          client: { select: { fullName: true } },
          applications: {
            where: { status: 'PENDING' },
            include: { freelancer: { select: { fullName: true } } },
          },
          _count: { select: { files: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          status: 'OPEN',
          applications: {
            none: { freelancerId: req.user.id },
          },
        },
        include: {
          client: { select: { fullName: true } },
          applications: {
            where: { status: 'PENDING' },
            include: { freelancer: { select: { fullName: true } } },
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
    ]);

    res.json({
      stats: {
        activeProjects: projects.filter((project) => project.status === 'IN_PROGRESS').length,
        pendingPayment: formatCurrency(pendingInvoices._sum.amount || 0),
        openRequests: openRequests.length,
        unreadMessages,
      },
      projects: projects.map(serializeProject),
      requests: openRequests.map(serializeProject),
      activities: [],
    });
  } catch (error) {
    next(error);
  }
};
