import { useEffect, useState } from 'react';
import { Link } from 'react-router';
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

export default function ClientPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ payments: PaymentRow[] }>('/payments/mine')
      .then((response) => setPayments(response.payments || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat pembayaran'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout userType="client">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Payments
      </h1>
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
              to={`/dashboard/client/projects/${payment.projectId}`}
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
