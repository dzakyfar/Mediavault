const prisma = require('../config/prisma');

exports.listNotifications = async (req, res, next) => {
  try {
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
          OR: [
            { clientId: req.user.id },
            { freelancerId: req.user.id },
          ],
          status: { in: ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'WAITING_PAYMENT'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.projectHistory.findMany({
        where: {
          project: {
            OR: [
              { clientId: req.user.id },
              { freelancerId: req.user.id },
            ],
          },
        },
        include: { project: { select: { id: true, title: true } } },
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
      actionUrl: `/dashboard/${req.user.role === 'FREELANCER' ? 'freelancer' : 'client'}/projects/${history.projectId}`,
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
        actionUrl: `/dashboard/${req.user.role === 'FREELANCER' ? 'freelancer' : 'client'}/messages`,
        synthetic: true,
      }]
      : [];

    const persisted = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: Boolean(notification.readAt),
      createdAt: notification.createdAt,
      actionUrl: notification.type === 'MESSAGE'
        ? `/dashboard/${req.user.role === 'FREELANCER' ? 'freelancer' : 'client'}/messages`
        : `/dashboard/${req.user.role === 'FREELANCER' ? 'freelancer' : 'client'}/projects`,
    }));

    const mergedNotifications = [
      ...messageSummary,
      ...persisted,
      ...projectStatusItems,
      ...historyItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 60);

    res.json({
      notifications: mergedNotifications,
      unreadCount: notifications.filter((notification) => !notification.readAt).length + unreadMessages,
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
