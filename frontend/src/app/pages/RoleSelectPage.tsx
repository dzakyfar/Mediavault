import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Camera, Check, Send, ShoppingBag, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, apiRequest } from '../lib/api';

interface TelegramConnectInfo {
  chatUrl: string;
  botHandle: string;
  startCommand: string;
}

export default function RoleSelectPage() {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | 'both' | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'role' | 'telegram'>('role');
  const [telegramInfo, setTelegramInfo] = useState<TelegramConnectInfo | null>(null);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramDone, setTelegramDone] = useState(false);
  const [pendingPath, setPendingPath] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateRole } = useAuth();

  const roleMap: Record<'client' | 'freelancer' | 'both', UserRole> = {
    client: 'CLIENT',
    freelancer: 'FREELANCER',
    both: 'BOTH',
  };

  useEffect(() => {
    if (!user?.role) return;
    navigate(user.role === 'FREELANCER' ? '/dashboard/freelancer' : '/dashboard/client', { replace: true });
  }, [navigate, user?.role]);

  useEffect(() => {
    const intent = searchParams.get('intent');
    if (intent === 'freelancer' || intent === 'client' || intent === 'both') {
      setSelectedRole(intent);
    }
  }, [searchParams]);

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      setSubmitting(true);
      setError('');
      const updatedUser = await updateRole(roleMap[selectedRole]);
      const destination = updatedUser.role === 'FREELANCER' || selectedRole !== 'client'
        ? '/freelancer-onboarding'
        : '/dashboard/client';

      try {
        const response = await apiRequest<{ telegram: { configured: boolean; connected: boolean } }>('/telegram/status');
        if (response.telegram.configured && !response.telegram.connected) {
          setPendingPath(destination);
          setStep('telegram');
          return;
        }
      } catch {
        // Telegram is optional; continue if the service is unavailable.
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyimpan role', 'Failed to save role'));
    } finally {
      setSubmitting(false);
    }
  };

  const connectTelegram = async () => {
    try {
      setTelegramBusy(true);
      const response = await apiRequest<{
        chatUrl?: string;
        botHandle?: string;
        startCommand?: string;
      }>('/telegram/connect', { method: 'POST' });
      setTelegramInfo({
        chatUrl: response.chatUrl || '',
        botHandle: response.botHandle || '',
        startCommand: response.startCommand || '',
      });
      if (response.startCommand) {
        await navigator.clipboard?.writeText(response.startCommand).catch(() => undefined);
      }
      if (response.chatUrl) {
        window.open(response.chatUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setTelegramBusy(false);
    }
  };

  const checkTelegramConnected = async () => {
    try {
      setTelegramBusy(true);
      const response = await apiRequest<{ telegram: { connected: boolean } }>('/telegram/sync-pending', { method: 'POST' });
      if (response.telegram.connected) {
        setTelegramDone(true);
        setTimeout(() => navigate(pendingPath, { replace: true }), 1000);
      }
    } finally {
      setTelegramBusy(false);
    }
  };

  if (step === 'telegram') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8 mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <div className="w-full max-w-lg text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <Zap className="w-6 h-6 text-[#F5C800]" />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
          </Link>

          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F5C800]/10 text-[#F5C800] mx-auto mb-6">
            <Send className="w-8 h-8" />
          </div>

          <h1 className="text-5xl text-white mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Aktifkan Notifikasi Telegram', 'Enable Telegram Notifications')}
          </h1>
          <p className="text-[#888888] mb-8">
            {t('Terima update order, pembayaran, dan revisi langsung di Telegram tanpa harus membuka dasbor terus.', 'Receive order, payment, and revision updates directly on Telegram without keeping the dashboard open.')}
          </p>

          {telegramDone ? (
            <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E] text-[#22C55E] font-bold mb-6">
              {t('Telegram berhasil terhubung! Mengarahkan ke dasbor...', 'Telegram connected successfully! Redirecting to dashboard...')}
            </div>
          ) : (
            <>
              {!telegramInfo ? (
                <button
                  type="button"
                  onClick={connectTelegram}
                  disabled={telegramBusy}
                  className="w-full py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-60 mb-4"
                >
                  {telegramBusy ? t('Membuka Telegram...', 'Opening Telegram...') : t('Hubungkan Telegram Sekarang', 'Connect Telegram Now')}
                </button>
              ) : (
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5 mb-4 text-left">
                  <p className="text-sm text-[#888888] mb-3">
                    {t('Perintah sudah disalin. Tempel ke chat bot', 'Command copied. Paste it into the bot chat')} <strong className="text-white">{telegramInfo.botHandle}</strong> {t('lalu kirim.', 'then send it.')}
                  </p>
                  <code className="block text-sm text-white bg-[#0A0A0A] rounded-lg p-3 break-all mb-3 select-all">
                    {telegramInfo.startCommand}
                  </code>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(telegramInfo.startCommand)}
                      className="px-3 py-2 border border-[#2A2A2A] text-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800]"
                    >
                      {t('Salin Ulang', 'Copy Again')}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(telegramInfo.chatUrl, '_blank', 'noopener,noreferrer')}
                      className="px-3 py-2 border border-[#F5C800] text-[#F5C800] rounded-lg text-sm hover:bg-[#F5C800] hover:text-black"
                    >
                      {t('Buka Bot Lagi', 'Open Bot Again')}
                    </button>
                  </div>
                </div>
              )}

              {telegramInfo && (
                <button
                  type="button"
                  onClick={checkTelegramConnected}
                  disabled={telegramBusy}
                  className="w-full py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-60 mb-4"
                >
                  {telegramBusy ? t('Mengecek...', 'Checking...') : t('Saya Sudah Mengirim Perintah', 'I Have Sent The Command')}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => navigate(pendingPath, { replace: true })}
            className="text-[#888888] hover:text-white text-sm transition-colors"
          >
            {t('Lewati dulu, bisa diatur nanti di Pengaturan', 'Skip for now, this can be configured later in Settings')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8 mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <Zap className="w-6 h-6 text-[#F5C800]" />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
          </Link>
          <h1 className="text-6xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Bagaimana kamu ingin memakai MediaVault?', 'How will you use MediaVault?')}
          </h1>
          <p className="text-[#888888]">{t('Kamu tetap bisa mengganti role nanti.', 'You can always switch later.')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`p-8 rounded-xl border-2 transition-all ${
              selectedRole === 'client'
                ? 'border-[#F5C800] shadow-[0_0_20px_rgba(245,200,0,0.3)] scale-105'
                : 'border-[#2A2A2A] hover:border-[#F5C800] hover:scale-102'
            } bg-[#141414] text-left relative`}
          >
            {selectedRole === 'client' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#F5C800] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
            <div className="w-16 h-16 bg-[#F5C800] rounded-lg flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('Saya Klien', "I'm a Client")}</h3>
            <p className="text-[#888888] mb-6">
              {t('Saya ingin memesan fotografer atau videografer untuk project saya.', 'I want to book photographers and videographers for my projects.')}
            </p>
            <div className="flex flex-wrap gap-2">
              {['Wedding', 'Product Shoot', 'Event', 'Corporate'].map((item) => (
                <span key={item} className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">{item}</span>
              ))}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('freelancer')}
            className={`p-8 rounded-xl border-2 transition-all ${
              selectedRole === 'freelancer'
                ? 'border-[#F5C800] shadow-[0_0_20px_rgba(245,200,0,0.3)] scale-105'
                : 'border-[#2A2A2A] hover:border-[#F5C800] hover:scale-102'
            } bg-[#141414] text-left relative`}
          >
            {selectedRole === 'freelancer' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#F5C800] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
            <div className="w-16 h-16 bg-[#F5C800] rounded-lg flex items-center justify-center mb-6">
              <Camera className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('Saya Freelancer', "I'm a Freelancer")}</h3>
            <p className="text-[#888888] mb-6">
              {t('Saya ingin menawarkan jasa foto atau video dan mendapatkan client.', 'I want to offer my photography or video services and get hired.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">{t('Bangun Portofolio', 'Build Portfolio')}</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">{t('Dapatkan Klien', 'Get Clients')}</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">{t('Tambah Pendapatan', 'Earn Money')}</span>
            </div>
          </button>
        </div>

        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setSelectedRole('both')}
            className="text-[#F5C800] hover:underline"
          >
            {t('Saya keduanya - Klien & Freelancer', "I'm both - Client & Freelancer")}
          </button>
        </div>

        <div className="text-center">
          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444] text-sm">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedRole || submitting}
            className={`px-12 py-4 rounded-full font-bold transition-all ${
              selectedRole
                ? 'bg-[#F5C800] text-black hover:shadow-[0_0_20px_rgba(245,200,0,0.4)]'
                : 'bg-[#2A2A2A] text-[#888888] cursor-not-allowed'
            }`}
          >
            {submitting ? t('MENYIMPAN...', 'SAVING...') : t('LANJUTKAN', 'CONTINUE')}
          </button>
          <p className="text-[#888888] text-sm mt-4">
            {t('Anda bisa mengganti role kapan saja dari pengaturan dasbor.', 'You can switch roles anytime from your dashboard settings.')}
          </p>
        </div>
      </div>
    </div>
  );
}
