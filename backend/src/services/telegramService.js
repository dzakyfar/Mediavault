const botToken = process.env.TELEGRAM_BOT_TOKEN;
const botUsername = process.env.TELEGRAM_BOT_USERNAME;
const publicAppUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || '';

const isTelegramConfigured = () => Boolean(botToken && botUsername);

const telegramApi = async (method, payload) => {
  if (!botToken) return null;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Telegram ${method} gagal (${response.status}): ${text.slice(0, 180)}`);
  }

  return response.json();
};

const telegramChatLink = () => {
  if (!botUsername) return null;
  return `https://web.telegram.org/k/#@${botUsername.replace(/^@/, '')}`;
};

const telegramBotHandle = () => {
  if (!botUsername) return null;
  return `@${botUsername.replace(/^@/, '')}`;
};

const dashboardUrl = (path = '') => {
  if (!publicAppUrl) return '';
  return `${publicAppUrl.replace(/\/$/, '')}${path}`;
};

const escapeMarkdown = (value = '') => String(value)
  .replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

const sendTelegramMessage = async ({ chatId, title, body, actionUrl }) => {
  if (!chatId || !isTelegramConfigured()) return false;

  const lines = [
    `*${escapeMarkdown(title || 'MediaVault Notification')}*`,
    body ? escapeMarkdown(body) : '',
  ].filter(Boolean);

  const payload = {
    chat_id: chatId,
    text: lines.join('\n\n'),
    parse_mode: 'MarkdownV2',
    disable_web_page_preview: true,
  };

  if (actionUrl) {
    payload.reply_markup = {
      inline_keyboard: [[{ text: 'Buka MediaVault', url: actionUrl }]],
    };
  }

  await telegramApi('sendMessage', payload);

  return true;
};

module.exports = {
  dashboardUrl,
  isTelegramConfigured,
  telegramBotHandle,
  telegramChatLink,
  sendTelegramMessage,
  telegramApi,
};
