const { isTelegramConfigured, telegramApi } = require('../services/telegramService');
const { pullTelegramUpdates } = require('../services/telegramUpdateService');

const POLLING_INTERVAL_MS = Number(process.env.TELEGRAM_POLLING_INTERVAL_MS || 5000);
const TELEGRAM_MODE = (process.env.TELEGRAM_BOT_MODE || 'polling').toLowerCase();

let started = false;
const pollTelegramUpdates = async () => {
  try {
    await pullTelegramUpdates({ source: 'polling-job' });
  } catch (error) {
    console.error('Telegram polling gagal:', error.message);
  }
};

const startTelegramPollingJob = async () => {
  if (started) return;
  if (TELEGRAM_MODE !== 'polling') {
    console.log(`Telegram polling tidak aktif: TELEGRAM_BOT_MODE=${TELEGRAM_MODE}. Gunakan polling untuk deploy HTTP/local.`);
    return;
  }

  if (!isTelegramConfigured()) {
    console.log('Telegram polling tidak aktif: TELEGRAM_BOT_TOKEN atau TELEGRAM_BOT_USERNAME belum diisi.');
    return;
  }

  started = true;

  // LOCAL / HTTP DEPLOY:
  // Polling tidak butuh HTTPS. Pastikan webhook kosong agar getUpdates tidak ditolak Telegram.
  // DEPLOY HTTPS:
  // Set TELEGRAM_BOT_MODE=webhook dan pasang webhook ke /api/telegram/webhook.
  await telegramApi('deleteWebhook', { drop_pending_updates: false }).catch((error) => {
    console.error('Gagal menghapus webhook Telegram sebelum polling:', error.message);
  });

  console.log(`Telegram polling aktif setiap ${POLLING_INTERVAL_MS}ms.`);
  await pollTelegramUpdates();
  setInterval(pollTelegramUpdates, POLLING_INTERVAL_MS);
};

module.exports = {
  startTelegramPollingJob,
};
