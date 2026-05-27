import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Smartphone, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

interface PaymentRow {
  id: string;
  projectId: string;
  klikqrisOrderId: string;
  totalAmountFormatted: string;
  status: string;
  expiredAt: string | null;
  paidAt: string | null;
  project: {
    title: string;
    freelancer: string | null;
  } | null;
}

interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amountFormatted: string;
  balanceAfterFormatted: string;
  description: string;
  createdAt: string;
}

interface WalletSummary {
  balance: number;
  balanceFormatted: string;
  transactions: WalletTransaction[];
}

export default function ClientPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletMessage, setWalletMessage] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'DANA',
    accountNumber: '',
    accountName: '',
  });

  const loadWallet = () => apiRequest<{ wallet: WalletSummary }>('/wallet/me')
    .then((response) => setWalletSummary(response.wallet));

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiRequest<{ payments: PaymentRow[] }>('/payments/mine')
      .then((response) => setPayments(response.payments || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat pembayaran')),
      loadWallet().catch(() => undefined),
    ])
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitWithdraw = async (event: FormEvent) => {
    event.preventDefault();
    setWalletMessage('');
    try {
      setWithdrawing(true);
      const response = await apiRequest<{ wallet: WalletSummary }>('/wallet/withdrawals', {
        method: 'POST',
        body: JSON.stringify(withdrawForm),
      });
      setWalletSummary(response.wallet);
      setWithdrawForm((current) => ({ ...current, amount: '', accountNumber: '', accountName: '' }));
      setWalletMessage('Withdraw saldo client masuk status Sedang Diproses.');
    } catch (err) {
      setWalletMessage(err instanceof Error ? err.message : 'Gagal membuat withdraw');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <DashboardLayout userType="client">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Payments
      </h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-8">
        <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-7 h-7 text-[#F5C800]" />
            <div>
              <div className="text-sm text-[#888888]">Saldo Client</div>
              <div className="text-4xl font-bold text-[#F5C800]">{walletSummary?.balanceFormatted || 'Rp 0'}</div>
            </div>
          </div>
          <p className="text-sm text-[#888888]">
            Saldo ini terisi dari refund order yang ditolak freelancer, dan bisa dipakai untuk membayar order berikutnya atau ditarik di sandbox.
          </p>
          <div className="mt-5 space-y-3">
            {(walletSummary?.transactions || []).slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-start justify-between gap-4 rounded-lg border border-[#2A2A2A] bg-[#141414] p-3">
                <div>
                  <div className="text-sm font-bold text-white">{transaction.description}</div>
                  <div className="text-xs text-[#888888]">{new Date(transaction.createdAt).toLocaleString('id-ID')}</div>
                </div>
                <div className={transaction.type === 'CREDIT' ? 'text-[#22C55E] font-bold text-sm' : 'text-[#EF4444] font-bold text-sm'}>
                  {transaction.type === 'CREDIT' ? '+' : '-'} {transaction.amountFormatted}
                </div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={submitWithdraw} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#F5C800]" />
            <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Withdraw Client
            </h2>
          </div>
          {walletMessage && (
            <div className="p-3 rounded-lg border border-[#2A2A2A] bg-[#141414] text-sm text-[#F5C800]">
              {walletMessage}
            </div>
          )}
          <label className="block text-sm text-[#888888]">
            Nominal
            <input
              type="number"
              min="1"
              value={withdrawForm.amount}
              onChange={(event) => setWithdrawForm((current) => ({ ...current, amount: event.target.value }))}
              className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
              placeholder="Contoh: 50000"
            />
          </label>
          <label className="block text-sm text-[#888888]">
            E-Wallet
            <select
              value={withdrawForm.method}
              onChange={(event) => setWithdrawForm((current) => ({ ...current, method: event.target.value }))}
              className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
            >
              <option value="DANA">DANA</option>
              <option value="GOPAY">GoPay</option>
              <option value="OVO">OVO</option>
            </select>
          </label>
          <label className="block text-sm text-[#888888]">
            Nomor E-Wallet
            <input
              value={withdrawForm.accountNumber}
              onChange={(event) => setWithdrawForm((current) => ({ ...current, accountNumber: event.target.value }))}
              className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
              placeholder="08xxxxxxxxxx"
            />
          </label>
          <label className="block text-sm text-[#888888]">
            Nama Pemilik
            <input
              value={withdrawForm.accountName}
              onChange={(event) => setWithdrawForm((current) => ({ ...current, accountName: event.target.value }))}
              className="mt-2 w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
              placeholder="Nama sesuai e-wallet"
            />
          </label>
          <button disabled={withdrawing} className="w-full py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60">
            {withdrawing ? 'Memproses...' : 'Tarik Saldo'}
          </button>
        </form>
      </div>
      {loading && <EmptyState title="Memuat pembayaran" description="Mengambil invoice QRIS dari database." />}
      {error && <EmptyState title="Gagal memuat pembayaran" description={error} />}
      {!loading && !error && payments.length === 0 && (
        <EmptyState
          title="Belum ada invoice"
          description="Invoice QRIS akan tampil di sini setelah client memilih freelancer."
        />
      )}
      {!loading && !error && payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Link
              key={payment.id}
              to={`/dashboard/client/payments/${payment.id}`}
              className="block bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#F5C800] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-white font-bold">{payment.project?.title || payment.klikqrisOrderId}</div>
                  <div className="text-sm text-[#888888]">{payment.klikqrisOrderId}</div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-[#F5C800] font-bold">{payment.totalAmountFormatted}</div>
                  <div className={payment.status === 'PAID' ? 'text-sm text-[#22C55E]' : 'text-sm text-[#888888]'}>
                    {payment.status}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
