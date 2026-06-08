import { FormEvent, useEffect, useState } from 'react';
import { Wallet, Smartphone, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amountFormatted: string;
  balanceAfterFormatted: string;
  description: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amountFormatted: string;
  netAmountFormatted: string;
  method: string;
  status: string;
  createdAt: string;
}

interface WalletSummary {
  balance: number;
  balanceFormatted: string;
  transactions: WalletTransaction[];
  withdrawals: Withdrawal[];
}

const methods = ['GOPAY', 'OVO', 'DANA'];

export default function FreelancerEarnings() {
  const { t, language } = useLanguage();
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    method: 'GOPAY',
    accountNumber: '',
    accountName: '',
  });

  const loadWallet = () => {
    setLoading(true);
    apiRequest<{ wallet: WalletSummary }>('/wallet/me')
      .then((response) => setWalletSummary(response.wallet))
      .catch((err) => setError(err instanceof Error ? err.message : t('Gagal memuat saldo', 'Failed to load balance')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const submitWithdraw = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      setSubmitting(true);
      const response = await apiRequest<{ wallet: WalletSummary }>('/wallet/withdrawals', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setWalletSummary(response.wallet);
      setForm((current) => ({ ...current, amount: '', accountNumber: '', accountName: '' }));
      setSuccess(t('Pengajuan penarikan dibuat. Status saldo: Sedang Diproses.', 'Withdrawal request created. Balance status: Processing.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal membuat penarikan', 'Failed to create withdrawal'));
    } finally {
      setSubmitting(false);
    }
  };

  const transactions = walletSummary?.transactions || [];
  const withdrawals = walletSummary?.withdrawals || [];

  return (
    <DashboardLayout userType="freelancer">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        {t('Pendapatan', 'Earnings')}
      </h1>

      {loading && <EmptyState title={t('Memuat saldo', 'Loading balance')} description={t('Menyiapkan ringkasan saldo dan pencairan Anda.', 'Preparing your balance and withdrawal summary.')} />}

      {!loading && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <section className="space-y-6">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-7 h-7 text-[#F5C800]" />
                <div>
                  <div className="text-sm text-[#888888]">{t('Saldo Tersedia', 'Available Balance')}</div>
                  <div className="text-4xl font-bold text-[#F5C800]">{walletSummary?.balanceFormatted || 'Rp 0'}</div>
                </div>
              </div>
              <p className="text-sm text-[#888888]">
                {t('Saldo bertambah setelah client mengonfirmasi pekerjaan selesai. Status penarikan akan diperbarui sesuai proses pencairan.', 'Your balance increases after the client confirms the project is complete. Withdrawal status will update with the payout process.')}
              </p>
            </div>

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {t('Riwayat Mutasi', 'Balance History')}
              </h2>
              {transactions.length === 0 && <p className="text-sm text-[#888888]">{t('Belum ada mutasi saldo.', 'No balance activity yet.')}</p>}
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-start justify-between gap-4 border border-[#2A2A2A] rounded-lg p-4 bg-[#141414]">
                    <div>
                      <div className="font-bold text-white">{transaction.description}</div>
                      <div className="text-sm text-[#888888]">{new Date(transaction.createdAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</div>
                      <div className="text-xs text-[#888888] mt-1">{t('Saldo akhir:', 'Ending balance:')} {transaction.balanceAfterFormatted}</div>
                    </div>
                    <div className={transaction.type === 'CREDIT' ? 'text-[#22C55E] font-bold' : 'text-[#EF4444] font-bold'}>
                      {transaction.type === 'CREDIT' ? '+' : '-'} {transaction.amountFormatted}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <form onSubmit={submitWithdraw} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#F5C800]" />
                <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t('Tarik Saldo', 'Withdraw Balance')}
                </h2>
              </div>

              {error && <div className="p-3 rounded-lg border border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444] text-sm">{error}</div>}
              {success && <div className="p-3 rounded-lg border border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E] text-sm">{success}</div>}

              <label className="block text-sm text-[#888888]">
                {t('Nominal Penarikan', 'Withdrawal Amount')}
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                  placeholder={t('Contoh: 50000', 'Example: 50000')}
                />
              </label>

              <label className="block text-sm text-[#888888]">
                E-Wallet
                <select
                  value={form.method}
                  onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
                  className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                >
                  {methods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>

              <label className="block text-sm text-[#888888]">
                {t('Nomor E-Wallet', 'E-Wallet Number')}
                <input
                  value={form.accountNumber}
                  onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
                  className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                  placeholder="08xxxxxxxxxx"
                />
              </label>

              <label className="block text-sm text-[#888888]">
                {t('Nama Pemilik', 'Account Holder Name')}
                <input
                  value={form.accountName}
                  onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))}
                  className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                  placeholder={t('Nama sesuai e-wallet', 'Name registered on the e-wallet')}
                />
              </label>

              <button
                disabled={submitting}
                className="w-full py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
              >
                {submitting ? t('Memproses...', 'Processing...') : t('Ajukan Penarikan', 'Submit Withdrawal')}
              </button>
            </form>

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#F5C800]" />
                <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t('Riwayat Penarikan', 'Withdrawal History')}
                </h2>
              </div>
              {withdrawals.length === 0 && <p className="text-sm text-[#888888]">{t('Belum ada pengajuan penarikan.', 'No withdrawal requests yet.')}</p>}
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border border-[#2A2A2A] rounded-lg p-4 bg-[#141414]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-white">{withdrawal.method}</div>
                      <span className="text-xs px-2 py-1 rounded-full bg-[#F5C800]/10 text-[#F5C800]">{withdrawal.status}</span>
                    </div>
                    <div className="text-sm text-[#888888] mt-2">{t('Ditarik', 'Requested')} {withdrawal.amountFormatted}</div>
                    <div className="text-sm text-[#888888]">{t('Diterima', 'Received')} {withdrawal.netAmountFormatted}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
