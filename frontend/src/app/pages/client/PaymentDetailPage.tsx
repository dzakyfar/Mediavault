import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { CheckCircle2, Circle, Download, MessageCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

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

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildClientAddress = (project: PaymentDetail['project']) => [
  project.addressDetail || project.address,
  project.village,
  project.district,
  project.city,
  project.province,
  project.postalCode,
].filter(Boolean).join(', ') || '-';

const buildInvoiceHtml = (payment: PaymentDetail) => {
  const rows = [
    ['Invoice Number', payment.invoiceNumber],
    ['KlikQRIS Order ID', payment.klikqrisOrderId],
    ['Payment Status', payment.status],
    ['Project', payment.project.title],
    ['Service Type', payment.project.serviceType || '-'],
    ['Client', payment.project.client || '-'],
    ['Freelancer', payment.project.freelancer || '-'],
    ['Event Date', formatDateTime(payment.project.eventDate)],
    ['Deadline', formatDateTime(payment.project.deadline)],
    ['Client Address', buildClientAddress(payment.project)],
    ['Service + Transport/Person Fee', payment.baseAmountFormatted],
    ['MediaVault Admin 1%', payment.adminFeeClientFormatted],
    ['MediaVault Estimated Total', payment.amountRequestFormatted],
    ['KlikQRIS Adjustment', payment.gatewayAdjustmentFormatted],
    ['Total Paid', payment.amountPaidFormatted || payment.totalAmountFormatted],
    ['Payment Time', formatDateTime(payment.paidAt)],
    ['Issued At', formatDateTime(payment.createdAt)],
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(payment.invoiceNumber)} - MediaVault Invoice</title>
  <style>
    body { margin: 0; background: #f5f2e8; color: #171717; font-family: Arial, sans-serif; }
    main { max-width: 840px; margin: 32px auto; background: #fffaf0; border: 1px solid #ded6bf; border-radius: 18px; padding: 40px; }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #f5c800; padding-bottom: 24px; margin-bottom: 28px; }
    h1 { margin: 0; font-size: 44px; letter-spacing: 0.04em; }
    .brand { color: #8a6f00; font-weight: 800; letter-spacing: 0.12em; }
    .status { display: inline-block; margin-top: 8px; padding: 8px 12px; border-radius: 999px; background: #f5c800; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 14px 0; border-bottom: 1px solid #e9dfc9; vertical-align: top; }
    th { width: 36%; color: #6d6658; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
    td { font-weight: 700; }
    .description { margin-top: 28px; padding: 18px; border-radius: 12px; background: #171717; color: #fffaf0; }
    footer { margin-top: 28px; color: #6d6658; font-size: 12px; line-height: 1.6; }
    @media print { body { background: white; } main { margin: 0; border: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand">MEDIAVAULT</div>
        <h1>Transaction Invoice</h1>
        <div class="status">${escapeHtml(payment.status)}</div>
      </div>
      <div>
        <strong>${escapeHtml(payment.invoiceNumber)}</strong><br />
        <span>Issued: ${escapeHtml(formatDateTime(payment.createdAt))}</span>
      </div>
    </header>
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
      </tbody>
    </table>
    <section class="description">
      <strong>Project Description</strong>
      <p>${escapeHtml(payment.project.description)}</p>
    </section>
    <footer>
      This invoice was generated from MediaVault transaction data. Keep this document for project and payment records.
    </footer>
  </main>
</body>
</html>`;
};

const downloadHtmlFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export default function ClientPaymentDetail() {
  const { t } = useLanguage();
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
      .catch((err) => setError(err instanceof Error ? err.message : t('Gagal memuat invoice', 'Failed to load invoice')))
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
        body: JSON.stringify({ action: 'approve', comment: t('Pekerjaan dikonfirmasi selesai dari halaman invoice.', 'Work confirmed complete from the invoice page.') }),
      });
      setActionMessage(t('Pekerjaan selesai. Dana diteruskan ke saldo freelancer.', 'Project completed. Funds were released to the freelancer balance.'));
      loadDetail();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : t('Gagal konfirmasi pekerjaan', 'Failed to confirm project completion'));
    } finally {
      setSubmitting(false);
    }
  };

  const downloadInvoice = () => {
    if (!payment) return;
    const safeInvoiceNumber = payment.invoiceNumber.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-');
    downloadHtmlFile(`mediavault-invoice-${safeInvoiceNumber}.html`, buildInvoiceHtml(payment));
  };

  return (
    <DashboardLayout userType="client">
      <Link to="/dashboard/client/payments" className="text-[#888888] hover:text-[#F5C800] transition-colors">
        {t('Kembali ke pembayaran', 'Back to payments')}
      </Link>

      <div className="mt-8">
        {loading && <EmptyState title={t('Memuat invoice', 'Loading invoice')} description={t('Menyiapkan detail transaksi dan status pembayaran.', 'Preparing transaction details and payment status.')} />}
        {error && <EmptyState title={t('Invoice tidak ditemukan', 'Invoice not found')} description={error} />}

        {payment && (
          <div className="space-y-6">
            <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="text-sm text-[#888888]">{payment.invoiceNumber}</div>
                  <h1 className="text-5xl mt-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {t('Invoice Transaksi', 'Transaction Invoice')}
                  </h1>
                  <p className="text-[#888888] mt-2">
                    {t('Status pembayaran:', 'Payment status:')} {payment.status === 'PAID' ? t('Menunggu Konfirmasi Freelancer / Progress Pekerjaan', 'Waiting for Freelancer Confirmation / Work Progress') : payment.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {payment.project.status === 'DELIVERED' && pendingSubmission && (
                    <button
                      onClick={confirmComplete}
                      disabled={submitting}
                      className="px-4 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
                    >
                      {submitting ? t('Memproses...', 'Processing...') : t('Konfirmasi Selesai', 'Confirm Complete')}
                    </button>
                  )}
                  <button onClick={downloadInvoice} className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] rounded-lg text-white hover:border-[#F5C800] hover:text-[#F5C800]">
                    <Download className="w-4 h-4" />
                    {t('Download Invoice', 'Download Invoice')}
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
                  const stepLabel = {
                    PAID: t('Pembayaran Berhasil', 'Payment Successful'),
                    WAITING_FREELANCER: t('Menunggu Konfirmasi Freelancer', 'Waiting for Freelancer Confirmation'),
                    IN_PROGRESS: t('Pekerjaan Berlangsung', 'Work in Progress'),
                    DELIVERED: t('Freelancer Selesai', 'Freelancer Delivered'),
                    WAITING_CLIENT: t('Menunggu Konfirmasi Klien', 'Waiting for Client Confirmation'),
                    COMPLETED: t('Dana Cair', 'Funds Released'),
                    DONE: t('Transaksi Selesai', 'Transaction Completed'),
                  }[step.key] || step.label;
                  return (
                    <div key={step.key} className={`rounded-lg border p-3 ${done ? 'border-[#22C55E]/50 bg-[#22C55E]/10' : 'border-[#2A2A2A] bg-[#141414]'}`}>
                      <Icon className={`w-5 h-5 mb-2 ${done ? 'text-[#22C55E]' : 'text-[#888888]'}`} />
                      <div className="text-sm font-bold text-white">{stepLabel}</div>
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
                  {tab === 'detail' ? t('Detail Pesanan', 'Order Details') : tab === 'progress' ? t('Tracking Progress', 'Progress Tracking') : tab === 'invoice' ? 'Invoice' : 'Chat'}
                </button>
              ))}
            </div>

            {activeTab === 'detail' && (
              <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 grid md:grid-cols-2 gap-4">
                <Info label="Freelancer" value={payment.project.freelancer || '-'} />
                <Info label={t('Jenis Jasa', 'Service Type')} value={payment.project.serviceType || '-'} />
                <Info label={t('Nama Pesanan', 'Order Name')} value={payment.project.title} />
                <Info label={t('Tanggal', 'Date')} value={`${formatDateTime(payment.project.eventDate)} - ${formatDateTime(payment.project.deadline)}`} />
                <div className="md:col-span-2">
                  <Info label={t('Deskripsi', 'Description')} value={payment.project.description} />
                </div>
                <div className="md:col-span-2">
                  <Info
                    label={t('Alamat Klien', 'Client Address')}
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
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Tracking Progress', 'Progress Tracking')}</h2>
                <div className="space-y-3">
                  {timeline.length === 0 && <p className="text-sm text-[#888888]">{t('Belum ada update progress.', 'No progress updates yet.')}</p>}
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
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Rincian Biaya', 'Cost Details')}</h2>
                <div className="space-y-3 text-sm">
                  <Row label={t('ID Transaksi', 'Transaction ID')} value={payment.invoiceNumber} />
                  <Row label="KlikQRIS Order ID" value={payment.klikqrisOrderId} />
                  <Row label={t('Biaya Jasa + Transport/Orang', 'Service + Transport/Person Fee')} value={payment.baseAmountFormatted} />
                  <Row label={t('Admin MediaVault 1%', 'MediaVault Admin 1%')} value={payment.adminFeeClientFormatted} />
                  <Row label={t('Total Estimasi MediaVault', 'MediaVault Estimated Total')} value={payment.amountRequestFormatted} />
                  {payment.gatewayAdjustment > 0 && (
                    <Row label={t('Kode Unik / Penyesuaian KlikQRIS', 'Unique Code / KlikQRIS Adjustment')} value={payment.gatewayAdjustmentFormatted} />
                  )}
                  <Row label={t('Total Dibayar', 'Total Paid')} value={payment.amountPaidFormatted || payment.totalAmountFormatted} strong />
                  <Row label={t('Waktu Pembayaran', 'Payment Time')} value={formatDateTime(payment.paidAt)} />
                </div>
              </section>
            )}

            {activeTab === 'chat' && (
              <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
                <h2 className="text-3xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Chat Transaksi', 'Transaction Chat')}</h2>
                <p className="text-[#888888] mb-4">{t('Percakapan transaksi tersedia di halaman Pesan utama.', 'Transaction conversations are available on the main Messages page.')}</p>
                <Link to="/dashboard/client/messages" className="inline-flex items-center gap-2 px-4 py-3 bg-[#F5C800] text-black rounded-lg font-bold">
                  <MessageCircle className="w-4 h-4" />
                  {t('Buka Chat', 'Open Chat')}
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
