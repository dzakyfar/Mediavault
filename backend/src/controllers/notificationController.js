const prisma = require('../config/prisma');

/**
 * Determine the notification context (client/freelancer) from query param or user role.
 */
function resolveContext(req) {
  const context = (req.query.context || '').toLowerCase();
  if (context === 'client' || context === 'freelancer') return context;
  if (req.user.role === 'FREELANCER') return 'freelancer';
  return 'client';
}

function basePath(context) {
  return context === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client';
}

exports.listNotifications = async (req, res, next) => {
  try {
    const context = resolveContext(req);
    const isBoth = req.user.role === 'BOTH';
    const base = basePath(context);

    // For BOTH users, filter projects by context role
    const projectFilter = isBoth
      ? (context === 'freelancer'
        ? { freelancerId: req.user.id }
        : { clientId: req.user.id })
      : {
          OR: [
            { clientId: req.user.id },
            { freelancerId: req.user.id },
          ],
        };

    const [notifications, unreadMessages, activeProjects, recentHistory] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.message.count({
        where: {
          receiverId: req.user.id,
          readAt: null,
        },
      }),
      prisma.project.findMany({
        where: {
          ...projectFilter,
          status: { in: ['OPEN', 'WAITING_PAYMENT', 'PAID', 'CONFIRMED', 'IN_PROGRESS', 'UNDER_REVIEW', 'DELIVERED'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.projectHistory.findMany({
        where: {
          project: projectFilter,
        },
        include: { project: { select: { id: true, title: true, clientId: true, freelancerId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const projectStatusItems = activeProjects.map((project) => ({
      id: `project-${project.id}`,
      type: 'PROJECT',
      title: `Status project: ${project.title}`,
      body: `Project sedang berada di tahap ${project.status.replaceAll('_', ' ').toLowerCase()}.`,
      read: true,
      createdAt: project.updatedAt,
      actionUrl: project.clientId === req.user.id
        ? `/dashboard/client/projects/${project.id}`
        : `/dashboard/freelancer/projects/${project.id}`,
      synthetic: true,
    }));

    const historyItems = recentHistory.map((history) => ({
      id: `history-${history.id}`,
      type: 'PROJECT',
      title: history.title,
      body: history.body || history.project.title,
      read: true,
      createdAt: history.createdAt,
      actionUrl: history.project.clientId === req.user.id
        ? `/dashboard/client/projects/${history.projectId}`
        : `/dashboard/freelancer/projects/${history.projectId}`,
      synthetic: true,
    }));

    const messageSummary = unreadMessages > 0
      ? [{
        id: 'unread-messages',
        type: 'MESSAGE',
        title: 'Pesan belum dibaca',
        body: `Ada ${unreadMessages} pesan masuk yang belum Anda buka.`,
        read: false,
        createdAt: new Date(),
        actionUrl: `${base}/messages`,
        synthetic: true,
      }]
      : [];

    const persisted = notifications
      .filter((notification) => notification.type !== 'MESSAGE')
      .map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: Boolean(notification.readAt),
      createdAt: notification.createdAt,
      actionUrl: notification.type === 'MESSAGE'
        ? `${base}/messages`
        : `${base}/projects`,
    }));

    const mergedNotifications = [
      ...messageSummary,
      ...persisted,
      ...projectStatusItems,
      ...historyItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 60);

    res.json({
      notifications: mergedNotifications,
      unreadCount: notifications.filter((notification) => notification.type !== 'MESSAGE' && !notification.readAt).length + unreadMessages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /notifications/unread-count?context=client|freelancer
 * Returns unread notification + message counts for the given context.
 * Used by the sidebar to show badge on the role-switch button.
 */
exports.getUnreadCountByContext = async (req, res, next) => {
  try {
    const context = resolveContext(req);
    const isBoth = req.user.role === 'BOTH';

    // For BOTH users, count projects where user has the context role
    const projectFilter = isBoth
      ? (context === 'freelancer'
        ? { freelancerId: req.user.id }
        : { clientId: req.user.id })
      : {
          OR: [
            { clientId: req.user.id },
            { freelancerId: req.user.id },
          ],
        };

    const [unreadNotifications, unreadMessages, activeProjectCount] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: req.user.id,
          type: { not: 'MESSAGE' },
          readAt: null,
        },
      }),
      prisma.message.count({
        where: {
          receiverId: req.user.id,
          readAt: null,
        },
      }),
      prisma.project.count({
        where: {
          ...projectFilter,
          status: { in: ['OPEN', 'WAITING_PAYMENT', 'PAID', 'CONFIRMED', 'IN_PROGRESS', 'UNDER_REVIEW', 'DELIVERED'] },
        },
      }),
    ]);

    res.json({
      context,
      unreadCount: unreadNotifications + unreadMessages,
      unreadNotifications,
      unreadMessages,
      activeProjectCount,
    });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        id: req.params.notificationId,
        userId: req.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({ message: 'Notifikasi ditandai sudah dibaca' });
  } catch (error) {
    next(error);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.notification.updateMany({
        where: { userId: req.user.id, readAt: null },
        data: { readAt: new Date() },
      }),
      prisma.message.updateMany({
        where: { receiverId: req.user.id, readAt: null },
        data: { readAt: new Date() },
      }),
    ]);

    res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
  } catch (error) {
    next(error);
  }
};
