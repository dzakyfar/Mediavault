import { useEffect, useState } from 'react';
import { Send, ShieldCheck, Unlink } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  enabled: boolean;
  username?: string | null;
  linkedAt?: string | null;
}

interface TelegramNotificationCardProps {
  onNotify: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TelegramNotificationCard({ onNotify }: TelegramNotificationCardProps) {
  const { t } = useLanguage();
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null);
  const [chatUrl, setChatUrl] = useState('');
  const [botHandle, setBotHandle] = useState('');
  const [startCommand, setStartCommand] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(false);

  const loadStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiRequest<{ telegram: TelegramStatus }>('/telegram/status');
      setTelegram(response.telegram);
      return response.telegram;
    } catch (error) {
      onNotify(error instanceof Error ? error.message : t('Gagal memuat status Telegram', 'Failed to load Telegram status'), 'error');
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (!waitingForStart || telegram?.connected) return undefined;

    let attempts = 0;
    const intervalId = window.setInterval(async () => {
      attempts += 1;

      try {
        const response = await apiRequest<{ telegram: TelegramStatus }>('/telegram/sync-pending', {
          method: 'POST',
        });
        setTelegram(response.telegram);

        if (response.telegram.connected) {
          setChatUrl('');
          setBotHandle('');
          setStartCommand('');
          setWaitingForStart(false);
          onNotify(t('Telegram berhasil tersambung. Notifikasi bot sudah aktif.', 'Telegram connected successfully. Bot notifications are now active.'), 'success');
          window.clearInterval(intervalId);
        }
      } catch {
        // Keep polling silently so the user does not get noisy errors while switching back from Telegram.
      }

      if (attempts >= 20) {
        setWaitingForStart(false);
        window.clearInterval(intervalId);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [waitingForStart, telegram?.connected, onNotify, t]);

  const startConnect = async () => {
    try {
      setBusy(true);
      const response = await apiRequest<{
        telegram: TelegramStatus;
        chatUrl?: string;
        botHandle?: string;
        startCommand?: string;
      }>('/telegram/connect', {
        method: 'POST',
      });
      setTelegram(response.telegram);
      setChatUrl(response.chatUrl || '');
      setBotHandle(response.botHandle || '');
      setStartCommand(response.startCommand || '');
      setWaitingForStart(true);

      try {
        if (response.startCommand) {
          await navigator.clipboard?.writeText(response.startCommand);
          onNotify(t('Command /start sudah dicopy. Paste ke chat bot Telegram, lalu kirim.', 'The /start command has been copied. Paste it into the Telegram bot chat, then send it.'), 'success');
        } else {
          onNotify(t('Bot Telegram dibuka. Copy command yang muncul, lalu paste ke chat bot.', 'Telegram bot opened. Copy the command shown here, then paste it into the bot chat.'), 'info');
        }
      } catch {
        onNotify(t('Bot Telegram dibuka. Browser memblokir clipboard, copy command manual dari card ini.', 'Telegram bot opened. Your browser blocked clipboard access, so copy the command manually from this card.'), 'info');
      }

      if (response.chatUrl) {
        window.open(response.chatUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      onNotify(error instanceof Error ? error.message : t('Gagal membuat link Telegram', 'Failed to create Telegram link'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleTelegram = async () => {
    if (!telegram?.connected) {
      await startConnect();
      return;
    }

    try {
      setBusy(true);
      const response = await apiRequest<{ telegram: TelegramStatus }>('/telegram/settings', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !telegram.enabled }),
      });
      setTelegram(response.telegram);
      onNotify(
        response.telegram.enabled ? t('Notifikasi Telegram aktif.', 'Telegram notifications are active.') : t('Notifikasi Telegram dinonaktifkan.', 'Telegram notifications are disabled.'),
        response.telegram.enabled ? 'success' : 'info'
      );
    } catch (error) {
      onNotify(error instanceof Error ? error.message : t('Gagal mengubah notifikasi Telegram', 'Failed to update Telegram notifications'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      setBusy(true);
      const response = await apiRequest<{ telegram: TelegramStatus }>('/telegram/disconnect', { method: 'DELETE' });
      setTelegram(response.telegram);
      setChatUrl('');
      setBotHandle('');
      setStartCommand('');
      setWaitingForStart(false);
      onNotify(t('Akun Telegram berhasil dilepas.', 'Telegram account disconnected.'), 'info');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : t('Gagal melepas Telegram', 'Failed to disconnect Telegram'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const refreshAfterStart = async () => {
    const response = await apiRequest<{ telegram: TelegramStatus }>('/telegram/sync-pending', {
      method: 'POST',
    });
    setTelegram(response.telegram);
    const latestStatus = response.telegram;

    if (latestStatus?.connected) {
      setChatUrl('');
      setBotHandle('');
      setStartCommand('');
      setWaitingForStart(false);
      onNotify(t('Telegram berhasil tersambung.', 'Telegram connected successfully.'), 'success');
      return;
    }

    onNotify(t('Belum tersambung. Pastikan command /start sudah dipaste dan dikirim ke bot Telegram.', 'Not connected yet. Make sure the /start command has been pasted and sent to the Telegram bot.'), 'info');
  };

  const openBotAndCopyCommand = async () => {
    if (startCommand) {
      try {
        await navigator.clipboard?.writeText(startCommand);
        onNotify(t('Command /start sudah disalin. Paste ke chat bot, lalu kirim.', 'The /start command has been copied. Paste it into the bot chat, then send it.'), 'success');
      } catch {
        onNotify(t('Clipboard diblokir browser. Copy command manual dari card ini.', 'Clipboard access was blocked. Copy the command manually from this card.'), 'info');
      }
    }
    if (chatUrl) {
      window.open(chatUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const connectedLabel = telegram?.username ? `@${telegram.username}` : t('Terhubung', 'Connected');

  return (
    <div className="rounded-xl border border-[#D8DEE8] bg-white p-8 text-[#111827] shadow-[0_16px_50px_rgba(15,23,42,0.06)] dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-white dark:shadow-none">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D9A900]/15 text-[#A87800] dark:bg-[#F5C800]/10 dark:text-[#F5C800]">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {t('Notifikasi Telegram', 'Telegram Notifications')}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[#667085] dark:text-[#888888]">
              {t(
                'Dapatkan update pesanan, pembayaran, revisi, dan approval langsung dari bot Telegram MediaVault tanpa harus terus membuka dashboard.',
                'Get order, payment, revision, and approval updates directly from the MediaVault Telegram bot without keeping the dashboard open.'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTelegram}
          disabled={busy || loading}
          className={`relative h-7 w-14 rounded-full transition-colors disabled:opacity-60 ${
            telegram?.enabled ? 'bg-[#D9A900] dark:bg-[#F5C800]' : 'bg-[#D8DEE8] dark:bg-[#2A2A2A]'
          }`}
          aria-label={t('Aktifkan atau nonaktifkan notifikasi Telegram', 'Toggle Telegram notifications')}
        >
          <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${telegram?.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-4 dark:border-[#2A2A2A] dark:bg-[#141414]">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#A87800] dark:text-[#F5C800]">{t('Langkah 1', 'Step 1')}</div>
          <p className="mt-2 text-sm text-[#667085] dark:text-[#AFAFAF]">
            {t('Klik Hubungkan Telegram. MediaVault akan membuat perintah khusus dan mencoba menyalinnya otomatis.', 'Click Connect Telegram. MediaVault will create a unique command and try to copy it automatically.')}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-4 dark:border-[#2A2A2A] dark:bg-[#141414]">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#A87800] dark:text-[#F5C800]">{t('Langkah 2', 'Step 2')}</div>
          <p className="mt-2 text-sm text-[#667085] dark:text-[#AFAFAF]">
            {t('Telegram Web akan terbuka. Tempel perintah yang sudah tersalin ke chat bot, lalu kirim.', 'Telegram Web will open. Paste the copied command into the bot chat, then send it.')}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-4 dark:border-[#2A2A2A] dark:bg-[#141414]">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#A87800] dark:text-[#F5C800]">{t('Langkah 3', 'Step 3')}</div>
          <p className="mt-2 text-sm text-[#667085] dark:text-[#AFAFAF]">
            {t('Kembali ke pengaturan. Status akan dicek otomatis, atau klik Saya sudah mengirim perintah.', 'Return to settings. The status will be checked automatically, or click I have sent the command.')}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-4 dark:border-[#2A2A2A] dark:bg-[#141414] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className={telegram?.connected ? 'h-5 w-5 text-[#22C55E]' : 'h-5 w-5 text-[#888888]'} />
          <div>
            <div className="font-bold">
              {loading ? t('Mengecek Telegram...', 'Checking Telegram...') : telegram?.connected ? connectedLabel : t('Telegram belum terhubung', 'Telegram is not connected')}
            </div>
            <div className="text-sm text-[#667085] dark:text-[#888888]">
              {telegram?.configured === false
                ? t('Admin perlu mengisi TELEGRAM_BOT_TOKEN dan TELEGRAM_BOT_USERNAME di server.', 'Admin must configure TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME on the server.')
                : waitingForStart
                  ? t('Menunggu perintah /start dikirim ke bot. Biasanya selesai beberapa detik setelah perintah ditempel.', 'Waiting for the /start command to be sent to the bot. This usually completes a few seconds after the command is pasted.')
                : telegram?.enabled
                  ? t('Bot aktif mengirim update penting.', 'The bot is active and will send important updates.')
                  : t('Fitur ini opsional dan bisa dinyalakan kapan saja.', 'This feature is optional and can be enabled anytime.')}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startConnect}
            disabled={busy}
            className="rounded-lg bg-[#D9A900] px-4 py-2 text-sm font-bold text-[#111827] transition-all hover:shadow-[0_0_18px_rgba(217,169,0,0.26)] disabled:opacity-60 dark:bg-[#F5C800] dark:text-black"
          >
            {telegram?.connected ? t('Hubungkan Ulang', 'Reconnect') : t('Hubungkan Telegram', 'Connect Telegram')}
          </button>
          {startCommand && (
            <button
              type="button"
              onClick={refreshAfterStart}
              className="rounded-lg border border-[#D8DEE8] px-4 py-2 text-sm font-bold text-[#111827] hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#888888] dark:text-white dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
            >
              {waitingForStart ? t('Mengecek koneksi...', 'Checking connection...') : t('Saya sudah mengirim perintah', 'I have sent the command')}
            </button>
          )}
          {chatUrl && (
            <button
              type="button"
              onClick={openBotAndCopyCommand}
              className="rounded-lg border border-[#D9A900] px-4 py-2 text-sm font-bold text-[#A87800] hover:bg-[#D9A900] hover:text-white dark:border-[#F5C800] dark:text-[#F5C800] dark:hover:bg-[#F5C800] dark:hover:text-black"
            >
              {t('Buka Bot Lagi', 'Open Bot Again')}
            </button>
          )}
          {telegram?.connected && (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-[#EF4444] px-4 py-2 text-sm font-bold text-[#EF4444] hover:bg-[#EF4444] hover:text-white disabled:opacity-60"
            >
              <Unlink className="h-4 w-4" />
              {t('Lepas Koneksi', 'Disconnect')}
            </button>
          )}
        </div>
      </div>

      {startCommand && (
        <div className="mt-4 rounded-2xl border border-[#D8DEE8] bg-white p-4 text-sm text-[#667085] dark:border-[#2A2A2A] dark:bg-[#101010] dark:text-[#AFAFAF]">
          <p>
            {t(
              'Perintah ini dibuat khusus untuk akun Anda. Kalau clipboard diblokir browser, salin manual lalu tempel ke bot.',
              'This command is unique to your account. If your browser blocks clipboard access, copy it manually and paste it into the bot.'
            )}
          </p>
          {botHandle && (
            <div className="mt-3 rounded-xl border border-[#D8DEE8] bg-[#F7F9FC] px-3 py-2 dark:border-[#2A2A2A] dark:bg-[#141414]">
              <span className="text-[#888888]">{t('Cari bot di Telegram Web: ', 'Find the bot on Telegram Web: ')}</span>
              <strong className="text-[#111827] dark:text-white">{botHandle}</strong>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-[#D8DEE8] bg-[#F7F9FC] px-3 py-2 text-[#111827] dark:border-[#2A2A2A] dark:bg-[#141414] dark:text-white">
              {startCommand}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(startCommand);
                onNotify(t('Perintah Start disalin. Tempel ke chat bot Telegram.', 'Start command copied. Paste it into the Telegram bot chat.'), 'success');
              }}
              className="rounded-lg border border-[#D8DEE8] px-4 py-2 font-bold text-[#111827] hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#888888] dark:text-white dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
            >
              {t('Salin', 'Copy')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
