const prisma = require('../config/prisma');
const { dashboardUrl, sendTelegramMessage } = require('./telegramService');

const routeForUserRole = (role, fallbackPath = '/dashboard/client/notifications') => {
  if (role === 'FREELANCER') return fallbackPath.replace('/client/', '/freelancer/');
  return fallbackPath;
};

const notifyUser = async ({
  tx,
  userId,
  type = 'INFO',
  title,
  body,
  actionPath,
  sendTelegram = true,
  telegramTitle,
  telegramBody,
}) => {
  const db = tx || prisma;
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
    },
  });

  if (!sendTelegram) return notification;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      telegramChatId: true,
      telegramNotifyEnabled: true,
    },
  }).catch(() => null);

  if (!user?.telegramChatId || !user.telegramNotifyEnabled) {
    return notification;
  }

  const normalizedAction = actionPath || routeForUserRole(user.role, '/dashboard/client/notifications');
  await sendTelegramMessage({
    chatId: user.telegramChatId,
    title: telegramTitle || title,
    body: telegramBody || body,
    actionUrl: dashboardUrl(normalizedAction),
  }).catch((error) => {
    console.error('Telegram notification failed:', error.message);
  });

  return notification;
};

const notifyTelegramOnly = async ({ userId, title, body, actionPath }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      telegramChatId: true,
      telegramNotifyEnabled: true,
    },
  }).catch(() => null);

  if (!user?.telegramChatId || !user.telegramNotifyEnabled) return false;

  const normalizedAction = actionPath || routeForUserRole(user.role, '/dashboard/client/notifications');
  await sendTelegramMessage({
    chatId: user.telegramChatId,
    title,
    body,
    actionUrl: dashboardUrl(normalizedAction),
  }).catch((error) => {
    console.error('Telegram notification failed:', error.message);
  });

  return true;
};

module.exports = {
  notifyTelegramOnly,
  notifyUser,
};
