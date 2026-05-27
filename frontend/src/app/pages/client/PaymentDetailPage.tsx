import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { CheckCircle2, Circle, Download, MessageCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

interface PaymentDetail {
  id: string;
  projectId: string;
  invoiceNumber: string;
  klikqrisOrderId: string;
  amountRequestFormatted: string;
  gatewayAdjustment: number;
  gatewayAdjustmentFormatted: string;
  amountPaidFormatted: string;
  baseAmountFormatted: string;
  adminFeeClientFormatted: string;
  totalAmountFormatted: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  project: {
    id: string;
    title: string;
    description: string;
    serviceType: string | null;
    status: string;
    client: string | null;
    freelancer: string | null;
    address: string | null;
    addressDetail: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    village: string | null;
    postalCode: string | null;
    eventDate: string | null;
    deadline: string | null;
  };
}

interface TimelineItem {
  id: string;
  title: string;
  body: string | null;
  eventType: string;
  createdAt: string;
}

interface SubmissionItem {
  id: string;
  comment: string;
  fileUrl: string | null;
  fileName: string | null;
  status: string;
  createdAt: string;
}

const steps = [
  { key: 'PAID', label: 'Pembayaran Berhasil' },
  { key: 'WAITING_FREELANCER', label: 'Menunggu Konfirmasi Freelancer' },
  { key: 'IN_PROGRESS', label: 'Pekerjaan Berlangsung' },
  { key: 'DELIVERED', label: 'Freelancer Selesai' },
  { key: 'WAITING_CLIENT', label: 'Menunggu Konfirmasi Client' },
  { key: 'COMPLETED', label: 'Dana Cair' },
  { key: 'DONE', label: 'Transaksi Selesai' },
];

const progressIndex = (status: string) => {
  if (status === 'PAID') return 1;
  if (status === 'IN_PROGRESS' || status === 'CONFIRMED' || status === 'UNDER_REVIEW') return 2;
  if (status === 'DELIVERED') return 4;
  if (status === 'COMPLETED' || status === 'AUTO_COMPLETED') return 6;
  if (status === 'CANCELLED') return 0;
  return 0;
};

const formatDateTime = (date: string | null) => date ? new Date(date).toLocaleString('id-ID') : '-';

export default function ClientPaymentDetail() {
  const { id } = useParams();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [activeTab, setActiveTab] = useState('detail');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = () => {
    if (!id) return;
    setLoading(true);
    apiRequest<{ payment: PaymentDetail; timeline: TimelineItem[]; submissions: SubmissionItem[] }>(`/payments/detail/${id}`)
      .then((response) => {
        setPayment(response.payment);
        setTimeline(response.timeline || []);
        setSubmissions(response.submissions || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat invoice'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const activeStep = useMemo(() => progressIndex(payment?.project.status || ''), [payment]);
  const pendingSubmission = submissions.find((submission) => submission.status === 'PENDING');

  const confirmComplete = async () => {
    if (!payment || !pendingSubmission) return;
    setSubmitting(true);
    setActionMessage('');
    try {
      await apiRequest(`/projects/${payment.projectId}/submissions/${pendingSubmission.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve', comment: 'Pekerjaan dikonfirmasi selesai dari halaman invoice.' }),
      });
      setActionMessage('Pekerjaan selesai. Dana diteruskan ke saldo freelancer.');
      loadDetail();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Gagal konfirmasi pekerjaan');
    } finally {
      setSubmitting(false);
    }
  };

  const printInvoice = () => window.print();

  return (
    <DashboardLayout userType="client">
      <Link to="/dashboard/client/payments" className="text-[#888888] hover:text-[#F5C800] transition-colors">
        Back to payments
      </Link>

      <div className="mt-8">
        {loading && <EmptyState title="Memuat invoice" description="Mengambil detail transaksi dan escrow dari backend." />}
        {error && <EmptyState title="Invoice tidak ditemukan" description={error} />}

        {payment && (
          <div className="space-y-6">
            <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="text-sm text-[#888888]">{payment.invoiceNumber}</div>
                  <h1 className="text-5xl mt-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Invoice Transaksi
                  </h1>
                  <p className="text-[#888888] mt-2">
                    Status pembayaran: {payment.status === 'PAID' ? 'Menunggu Konfirmasi Freelancer / Progress Pekerjaan' : payment.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {payment.project.status === 'DELIVERED' && pendingSubmission && (
                    <button
                      onClick={confirmComplete}
                      disabled={submitting}
                      className="px-4 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
                    >
                      {submitting ? 'Memproses...' : 'Konfirmasi Selesai'}
                    </button>
                  )}
                  <button onClick={printInvoice} className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] rounded-lg text-white hover:border-[#F5C800] hover:text-[#F5C800]">
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
                  <Link to="/dashboard/client/messages" className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] rounded-lg text-white hover:border-[#F5C800] hover:text-[#F5C800]">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Link>
                </div>
              </div>
              {actionMessage && <div className="mt-4 p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] text-sm text-[#F5C800]">{actionMessage}</div>}
            </section>

            <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="grid md:grid-cols-7 gap-3">
                {steps.map((step, index) => {
                  const done = index <= activeStep;
                  const Icon = done ? CheckCircle2 : Circle;
                  return (
                    <div key={step.key} className={`rounded-lg border p-3 ${done ? 'border-[#22C55E]/50 bg-[#22C55E]/10' : 'border-[#2A2A2A] bg-[#141414]'}`}>
                      <Icon className={`w-5 h-5 mb-2 ${done ? 'text-[#22C55E]' : 'text-[#888888]'}`} />
                      <div className="text-sm font-bold text-white">{step.label}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              {['detail', 'progress', 'invoice', 'chat'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg border font-bold ${activeTab === tab ? 'bg-[#F5C800] text-black border-[#F5C800]' : 'border-[#2A2A2A] text-white bg-[#141414]'}`}
                >
                  {tab === 'detail' ? 'Detail Pesanan' : tab === 'progress' ? 'Tracking Progress' : tab === 'invoice' ? 'Invoice' : 'Chat'}
                </button>
              ))}
            </div>

            {activeTab === 'detail' && (
              <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 grid md:grid-cols-2 gap-4">
                <Info label="Freelancer" value={payment.project.freelancer || '-'} />
                <Info label="Jenis Jasa" value={payment.project.serviceType || '-'} />
                <Info label="Nama Pesanan" value={payment.project.title} />
                <Info label="Tanggal" value={`${formatDateTime(payment.project.eventDate)} - ${formatDateTime(payment.project.deadline)}`} />
                <div className="md:col-span-2">
                  <Info label="Deskripsi" value={payment.project.description} />
                </div>
                <div className="md:col-span-2">
                  <Info
                    label="Alamat Client"
                    value={[
                      payment.project.addressDetail || payment.project.address,
                      payment.project.village,
                      payment.project.district,
                      payment.project.city,
                      payment.project.province,
                      payment.project.postalCode,
                    ].filter(Boolean).join(', ') || '-'}
                  />
                </div>
              </section>
            )}

            {activeTab === 'progress' && (
              <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Tracking Progress</h2>
                <div className="space-y-3">
                  {timeline.length === 0 && <p className="text-sm text-[#888888]">Belum ada update progress.</p>}
                  {timeline.map((item) => (
                    <div key={item.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-sm text-[#888888]">{formatDateTime(item.createdAt)}</div>
                      </div>
                      {item.body && <p className="text-[#888888] mt-1">{item.body}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'invoice' && (
              <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Rincian Biaya</h2>
                <div className="space-y-3 text-sm">
                  <Row label="ID Transaksi" value={payment.invoiceNumber} />
                  <Row label="KlikQRIS Order ID" value={payment.klikqrisOrderId} />
                  <Row label="Biaya Jasa + Transport/Orang" value={payment.baseAmountFormatted} />
                  <Row label="Admin MediaVault 1%" value={payment.adminFeeClientFormatted} />
                  <Row label="Total Estimasi MediaVault" value={payment.amountRequestFormatted} />
                  {payment.gatewayAdjustment > 0 && (
                    <Row label="Kode Unik / Penyesuaian KlikQRIS" value={payment.gatewayAdjustmentFormatted} />
                  )}
                  <Row label="Total Dibayar" value={payment.amountPaidFormatted || payment.totalAmountFormatted} strong />
                  <Row label="Timestamp Pembayaran" value={formatDateTime(payment.paidAt)} />
                </div>
              </section>
            )}

            {activeTab === 'chat' && (
              <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
                <h2 className="text-3xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Chat Transaksi</h2>
                <p className="text-[#888888] mb-4">Percakapan transaksi masih memakai halaman Messages utama.</p>
                <Link to="/dashboard/client/messages" className="inline-flex items-center gap-2 px-4 py-3 bg-[#F5C800] text-black rounded-lg font-bold">
                  <MessageCircle className="w-4 h-4" />
                  Buka Chat
                </Link>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
      <div className="text-sm text-[#888888] mb-1">{label}</div>
      <div className="text-white font-bold whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#2A2A2A] pb-3">
      <div className="text-[#888888]">{label}</div>
      <div className={strong ? 'text-[#F5C800] text-lg font-bold' : 'text-white font-bold'}>{value}</div>
    </div>
  );
}
