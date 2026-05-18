const prisma = require('../config/prisma');

exports.listNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        read: Boolean(notification.readAt),
        createdAt: notification.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};
