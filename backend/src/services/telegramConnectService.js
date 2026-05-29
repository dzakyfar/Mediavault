const prisma = require('../config/prisma');
const { telegramApi } = require('./telegramService');

const findPendingUserByToken = (token) => prisma.user.findFirst({
  where: {
    telegramConnectToken: token,
    telegramConnectExpiresAt: { gt: new Date() },
  },
  select: { id: true, fullName: true },
});

const findOnlyPendingUser = async () => {
  const pendingUsers = await prisma.user.findMany({
    where: {
      telegramConnectToken: { not: null },
      telegramConnectExpiresAt: { gt: new Date() },
    },
    select: { id: true, fullName: true },
    take: 2,
  });

  return pendingUsers.length === 1 ? pendingUsers[0] : null;
};

const processTelegramStartMessage = async ({ text = '', chat = {}, from = {} }) => {
  if (!chat?.id || !String(text).startsWith('/start')) {
    return { linked: false, reason: 'ignored' };
  }

  const token = String(text).split(' ')[1];
  let user = null;

  if (!token) {
    // LOCAL / MOBILE TELEGRAM FALLBACK:
    // Kadang user membuka bot manual sehingga Telegram mengirim "/start" tanpa payload token.
    // Kalau hanya ada satu akun yang sedang menunggu koneksi, aman untuk menyambungkan akun itu.
    user = await findOnlyPendingUser();
    if (!user) {
      console.log('Telegram /start diterima tanpa token connect dan tidak ada satu pending user yang unik.');
      return { linked: false, reason: 'missing_token' };
    }
  } else {
    user = await findPendingUserByToken(token);
  }

  if (!user) {
    console.log(`Telegram /start token tidak valid atau sudah expired. Token prefix: ${token.slice(0, 8)}...`);
    return { linked: false, reason: 'invalid_or_expired_token' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: String(chat.id),
      telegramUsername: from.username || chat.username || null,
      telegramNotifyEnabled: true,
      telegramLinkedAt: new Date(),
      telegramConnectToken: null,
      telegramConnectExpiresAt: null,
    },
  });

  await telegramApi('sendMessage', {
    chat_id: chat.id,
    text: `Halo ${user.fullName}, akun Telegram kamu sudah terhubung dengan MediaVault. Notifikasi penting akan dikirim ke sini.`,
  }).catch(() => undefined);

  console.log(`Telegram terhubung untuk user ${user.id} pada chat ${chat.id}.`);
  return { linked: true, userId: user.id };
};

module.exports = {
  processTelegramStartMessage,
};
