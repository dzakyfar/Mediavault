const crypto = require('crypto');
const prisma = require('../config/prisma');
const { processTelegramStartMessage } = require('../services/telegramConnectService');
const {
  isTelegramConfigured,
  telegramBotHandle,
  telegramChatLink,
} = require('../services/telegramService');
const { pullTelegramUpdates } = require('../services/telegramUpdateService');

const CONNECT_TOKEN_TTL_MS = 30 * 60 * 1000;

const createConnectToken = () => crypto.randomBytes(24).toString('hex');

const telegramStatusForUser = (user) => ({
  configured: isTelegramConfigured(),
  connected: Boolean(user.telegramChatId),
  enabled: Boolean(user.telegramNotifyEnabled),
  username: user.telegramUsername,
  linkedAt: user.telegramLinkedAt,
});

exports.getTelegramStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifyEnabled: true,
        telegramLinkedAt: true,
      },
    });

    res.json({ telegram: telegramStatusForUser(user || {}) });
  } catch (error) {
    next(error);
  }
};

exports.createTelegramConnect = async (req, res, next) => {
  try {
    if (!isTelegramConfigured()) {
      res.status(503);
      throw new Error('Telegram bot belum dikonfigurasi di server.');
    }

    const token = createConnectToken();
    const expiresAt = new Date(Date.now() + CONNECT_TOKEN_TTL_MS);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        telegramConnectToken: token,
        telegramConnectExpiresAt: expiresAt,
      },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifyEnabled: true,
        telegramLinkedAt: true,
      },
    });

    res.json({
      telegram: telegramStatusForUser(user),
      chatUrl: telegramChatLink(),
      botHandle: telegramBotHandle(),
      startCommand: `/start ${token}`,
      expiresAt,
    });
    console.log(`Telegram connect token dibuat untuk user ${req.user.id}, berlaku sampai ${expiresAt.toISOString()}.`);
  } catch (error) {
    next(error);
  }
};

exports.syncTelegramPendingUpdates = async (req, res, next) => {
  try {
    if (!isTelegramConfigured()) {
      res.status(503);
      throw new Error('Telegram bot belum dikonfigurasi di server.');
    }

    // LOCAL / HTTP DEPLOY FALLBACK:
    // Jika polling belum menangkap /start, endpoint ini menarik pending update saat user klik
    // "Saya sudah kirim command". Untuk HTTPS production, webhook tetap bisa dipakai.
    const syncResult = await pullTelegramUpdates({ source: 'manual-sync' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifyEnabled: true,
        telegramLinkedAt: true,
      },
    });

    res.json({
      telegram: telegramStatusForUser(user || {}),
      processed: syncResult.processed,
      totalUpdates: syncResult.totalUpdates,
      skipped: syncResult.skipped,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTelegramSettings = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        telegramNotifyEnabled: Boolean(enabled) && Boolean(req.user.telegramChatId),
      },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifyEnabled: true,
        telegramLinkedAt: true,
      },
    });

    res.json({ telegram: telegramStatusForUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.disconnectTelegram = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramNotifyEnabled: false,
        telegramLinkedAt: null,
        telegramConnectToken: null,
        telegramConnectExpiresAt: null,
      },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifyEnabled: true,
        telegramLinkedAt: true,
      },
    });

    res.json({ telegram: telegramStatusForUser(user) });
  } catch (error) {
    next(error);
  }
};

exports.telegramWebhook = async (req, res, next) => {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && req.get('x-telegram-bot-api-secret-token') !== secret) {
      res.status(401);
      throw new Error('Telegram webhook secret tidak valid');
    }

    await processTelegramStartMessage({
      text: req.body?.message?.text || '',
      chat: req.body?.message?.chat || {},
      from: req.body?.message?.from || {},
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
