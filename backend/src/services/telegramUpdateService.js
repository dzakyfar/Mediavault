const { processTelegramStartMessage } = require('./telegramConnectService');
const { telegramApi } = require('./telegramService');

let offset = 0;
let pulling = false;

const pullTelegramUpdates = async ({ source = 'unknown' } = {}) => {
  if (pulling) {
    return {
      skipped: true,
      reason: 'already_pulling',
      processed: 0,
      totalUpdates: 0,
    };
  }

  pulling = true;

  try {
    const response = await telegramApi('getUpdates', {
      offset,
      timeout: 0,
      allowed_updates: ['message'],
    });

    const updates = response?.result || [];
    const results = [];

    for (const update of updates) {
      offset = Math.max(offset, Number(update.update_id) + 1);
      const result = await processTelegramStartMessage({
        text: update.message?.text || '',
        chat: update.message?.chat || {},
        from: update.message?.from || {},
      });
      results.push(result);
    }

    return {
      skipped: false,
      source,
      processed: results.filter((result) => result.linked).length,
      totalUpdates: updates.length,
      results,
    };
  } catch (error) {
    if (error.message.includes('"error_code":409') || error.message.includes('Conflict')) {
      console.error(`Telegram getUpdates conflict dari ${source}: ada instance bot lain yang sedang polling.`);
    } else {
      console.error(`Telegram getUpdates gagal dari ${source}:`, error.message);
    }
    throw error;
  } finally {
    pulling = false;
  }
};

module.exports = {
  pullTelegramUpdates,
};
