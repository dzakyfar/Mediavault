import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { RefreshCcw, Star, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ProjectTracker from '../../components/dashboard/ProjectTracker';
import ProjectReviewPanel, { ProjectSubmission } from '../../components/dashboard/ProjectReviewPanel';
import { apiRequest } from '../../lib/api';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  serviceType: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  village: string | null;
  postalCode: string | null;
  address: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSource: string | null;
  eventDate: string;
  due: string;
  status: string;
  statusColor: string;
  amount: string;
  freelancer: string;
  pendingOffers: Array<{
    id: string;
    freelancer: string;
    freelancerFullName: string;
    freelancerId: string;
    freelancerSpecialty: string | null;
    rating: string | null;
    serviceType: string | null;
    message: string | null;
  }>;
  tracking: Array<{
    status: string;
    label: string;
    progress: number;
    done: boolean;
    active: boolean;
  }>;
  histories: Array<{
    id: string;
    title: string;
    body: string | null;
    eventType: string;
    createdAt: string;
  }>;
  submissions: ProjectSubmission[];
  referenceFiles: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    contentType: string | null;
    size: number | null;
    createdAt: string;
  }>;
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  } | null;
  latestPayment: PaymentDetail | null;
}

interface PaymentDetail {
  id: string;
  projectId: string;
  klikqrisOrderId: string;
  amountRequest: number;
  amountRequestFormatted: string;
  gatewayAdjustment: number;
  gatewayAdjustmentFormatted: string;
  amountPaid: number | null;
  amountPaidFormatted: string;
  baseAmount: number;
  baseAmountFormatted: string;
  adminFeeClient: number;
  adminFeeClientFormatted: string;
  totalAmount: number;
  totalAmountFormatted: string;
  qrisUrl: string | null;
  directUrl: string | null;
  signature?: string;
  isSandbox?: boolean;
  status: string;
  expiredAt: string | null;
  paidAt: string | null;
}

const normalizeProjectDetail = (project: ProjectDetail): ProjectDetail => ({
  ...project,
  pendingOffers: project.pendingOffers || [],
  tracking: project.tracking || [],
  histories: project.histories || [],
  submissions: project.submissions || [],
  referenceFiles: project.referenceFiles || [],
});

export default function ClientProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: '5',
    comment: '',
  });
  const [showAllApplicants, setShowAllApplicants] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState('');
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiRequest<{ project: ProjectDetail }>(`/projects/${id}`)
      .then((response) => {
        const nextProject = normalizeProjectDetail(response.project);
        setProject(nextProject);
        if (nextProject.latestPayment) setPayment(nextProject.latestPayment);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat detail project'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!paymentOpen || !payment || payment.status !== 'PENDING') return undefined;

    const interval = window.setInterval(async () => {
      try {
        const response = await apiRequest<{ payment: PaymentDetail }>(`/payments/${payment.klikqrisOrderId}/status`);
        setPayment(response.payment);
        if (response.payment.status === 'PAID' && id) {
          const projectResponse = await apiRequest<{ project: ProjectDetail }>(`/projects/${id}`);
          setProject(normalizeProjectDetail(projectResponse.project));
        }
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : 'Gagal memperbarui status pembayaran');
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [id, payment, paymentOpen]);

  useEffect(() => {
    if (!paymentOpen || payment?.status !== 'PAID') return;
    const timeout = window.setTimeout(() => {
      navigate(`/dashboard/client/payments/${payment.id}`);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [navigate, payment, paymentOpen]);

  const createOrOpenPayment = async () => {
    if (!id) return;

    try {
      setPaymentLoading(true);
      setPaymentError('');
      const response = await apiRequest<{ payment: PaymentDetail }>(`/payments/projects/${id}/create`, {
        method: 'POST',
      });
      setPayment(response.payment);
      setPaymentOpen(true);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Gagal membuat QRIS pembayaran');
    } finally {
      setPaymentLoading(false);
    }
  };

  const confirmOffer = async (offer: ProjectDetail['pendingOffers'][number]) => {
    if (!id) return;

    try {
      setAcceptingOfferId(offer.id);
      setError('');
      setPaymentError('');
      await apiRequest(`/projects/applications/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      });
      const response = await apiRequest<{ project: ProjectDetail }>(`/projects/${id}`);
      const nextProject = normalizeProjectDetail(response.project);
      setProject(nextProject);
      await createOrOpenPayment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengkonfirmasi freelancer');
    } finally {
      setAcceptingOfferId('');
    }
  };

  const ApplicantCard = ({ offer }: { offer: ProjectDetail['pendingOffers'][number] }) => (
    <div className="min-w-[280px] bg-[#141414] rounded-lg p-4 border border-[#2A2A2A]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-bold text-white">{offer.freelancerFullName || offer.freelancer}</div>
          <div className="text-sm text-[#888888]">{offer.freelancerSpecialty || offer.serviceType || project?.serviceType || 'Jasa kreatif'}</div>
        </div>
        <span className="text-sm text-[#F5C800]">{offer.rating ? `★ ${offer.rating}` : 'Baru'}</span>
      </div>
      {offer.message && <p className="text-sm text-[#888888] mb-4 line-clamp-2">{offer.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/dashboard/client/messages?peerId=${offer.freelancerId}&peerName=${encodeURIComponent(offer.freelancerFullName || offer.freelancer || 'Freelancer')}`}
          className="px-3 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
        >
          Message
        </Link>
        <Link
          to={`/freelancer/${offer.freelancerId}`}
          className="px-3 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
        >
          View Profile
        </Link>
        <button
          onClick={() => confirmOffer(offer)}
          disabled={acceptingOfferId === offer.id}
          className="px-3 py-2 bg-[#F5C800] text-black rounded-lg text-sm font-bold hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all"
        >
          {acceptingOfferId === offer.id ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>
    </div>
  );

  const submitFreelancerReview = async () => {
    if (!id) return;

    try {
      setReviewSaving(true);
      setReviewError('');
      const response = await apiRequest<{ project: ProjectDetail }>(`/projects/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        }),
      });
      setProject(normalizeProjectDetail(response.project));
      setReviewForm({ rating: '5', comment: '' });
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Gagal menyimpan ulasan');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <DashboardLayout userType="client">
      <Link to="/dashboard/client/projects" className="text-[#888888] hover:text-[#F5C800] transition-colors">
        Back to projects
      </Link>

      <div className="mt-8">
        {loading && <EmptyState title="Memuat project" description="Mengambil detail lengkap project dari database." />}
        {error && <EmptyState title="Project tidak ditemukan" description={error} />}

        {project && (
          <div className="space-y-6">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-5xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{project.title}</h1>
                  <p className="text-[#888888]">{project.description}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${project.statusColor}`}>
                  {project.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">Jasa</div>
                  <div className="text-white font-bold">{project.serviceType || project.category}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">Budget</div>
                  <div className="text-[#F5C800] font-bold">{project.amount}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">Tanggal Pelaksanaan</div>
                  <div className="text-white font-bold">{project.eventDate}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">Deadline</div>
                  <div className="text-white font-bold">{project.due}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4 md:col-span-2">
                  <div className="text-[#888888] mb-1">Lokasi</div>
                  <div className="text-white font-bold">
                    {[project.village, project.district, project.city, project.province].filter(Boolean).join(', ') || '-'}
                  </div>
                  <p className="text-[#888888] mt-2">{project.addressDetail || project.address || '-'}</p>
                  {project.postalCode && <p className="text-[#888888] mt-1">Kode Pos: {project.postalCode}</p>}
                  {project.latitude && project.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-[#F5C800] hover:underline"
                    >
                      Open Maps
                    </a>
                  )}
                </div>
              </div>
            </div>

            {project.pendingOffers.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Freelancer Requests</h2>
                  {project.pendingOffers.length > 3 && (
                    <button
                      onClick={() => setShowAllApplicants(true)}
                      className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {project.pendingOffers.slice(0, 3).map((offer) => (
                    <ApplicantCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </div>
            )}

            {['Waiting Payment'].includes(project.status) && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      Pembayaran QRIS
                    </h2>
                    <p className="text-[#888888]">
                      Buat QRIS dinamis untuk mengunci freelancer dan mencatat dana escrow internal.
                    </p>
                    {paymentError && <p className="mt-3 text-sm text-[#EF4444]">{paymentError}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={createOrOpenPayment}
                    disabled={paymentLoading}
                    className="px-5 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
                  >
                    {paymentLoading ? 'Membuat QR...' : payment ? 'Lihat QRIS' : 'Bayar dengan QRIS'}
                  </button>
                </div>
              </div>
            )}

            <ProjectTracker
              projectId={project.id}
              stages={project.tracking}
              histories={project.histories}
              canUpdate={false}
              onUpdated={(updatedProject) => setProject(updatedProject as ProjectDetail)}
            />

            {project.referenceFiles.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Reference Files
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {project.referenceFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      download={file.fileName}
                      className="block bg-[#141414] border border-[#2A2A2A] rounded-lg p-4 hover:border-[#F5C800] transition-colors"
                    >
                      <div className="text-white font-bold">{file.fileName}</div>
                      <div className="text-sm text-[#888888]">{file.createdAt}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {project.freelancer && project.freelancer !== 'Belum ada freelancer' && (
              <ProjectReviewPanel
                projectId={project.id}
                userType="client"
                projectStatus={project.status}
                submissions={project.submissions}
                onUpdated={(updatedProject) => setProject(updatedProject as ProjectDetail)}
              />
            )}

            {project.freelancer && project.freelancer !== 'Belum ada freelancer' && ['Completed', 'Auto Completed'].includes(project.status) && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Freelancer Review
                </h2>
                <p className="text-[#888888] mb-5">
                  Bagikan ulasan setelah pekerjaan selesai dan dana diteruskan ke freelancer.
                </p>

                {project.review ? (
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5">
                    <div className="flex items-center gap-2 text-[#F5C800] font-bold mb-2">
                      <Star className="w-5 h-5 fill-current" />
                      {project.review.rating}/5
                    </div>
                    <p className="text-white mb-2">"{project.review.comment}"</p>
                    <p className="text-sm text-[#888888]">{project.review.createdAt}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewError && (
                      <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-sm">
                        {reviewError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-[#888888] mb-2">Rating</label>
                      <select
                        value={reviewForm.rating}
                        onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}
                        className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>{value} Star</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#888888] mb-2">Ulasan</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                        rows={4}
                        placeholder="Ceritakan kualitas kerja freelancer..."
                        className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={submitFreelancerReview}
                      disabled={reviewSaving}
                      className="px-5 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
                    >
                      {reviewSaving ? 'Saving...' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {showAllApplicants && project && (
        <div className="fixed inset-y-0 left-0 right-0 z-50 bg-black/70 flex items-center justify-center p-4 md:left-60">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>All Freelancer Requests</h2>
              <button
                onClick={() => setShowAllApplicants(false)}
                className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                Close
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {project.pendingOffers.map((offer) => (
                <ApplicantCard key={offer.id} offer={offer} />
              ))}
            </div>
          </div>
        </div>
      )}

      {paymentOpen && payment && (
        <div className="fixed inset-y-0 left-0 right-0 z-50 bg-black/70 flex items-center justify-center p-4 md:left-60">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    PEMBAYARAN QRIS
                  </h2>
                  {payment.isSandbox && (
                    <span className="px-2 py-1 rounded-md bg-orange-500/20 border border-orange-500 text-orange-400 text-xs font-bold tracking-widest">
                      SANDBOX
                    </span>
                  )}
                </div>
                <p className="text-[#888888] text-sm">{payment.klikqrisOrderId}</p>
                {payment.isSandbox && (
                  <p className="text-orange-400 text-xs mt-1">
                    Mode testing — tidak ada uang nyata yang diproses.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="p-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                aria-label="Tutup modal pembayaran"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-[240px_1fr] gap-6">
              <div className="relative">
                <div className="bg-white rounded-lg p-4 min-h-[240px] flex items-center justify-center">
                  {payment.qrisUrl ? (
                    <img src={payment.qrisUrl} alt="QRIS pembayaran" className="w-full h-auto" />
                  ) : (
                    <span className="text-black text-sm text-center">QRIS tidak tersedia dari gateway</span>
                  )}
                </div>
                {payment.isSandbox && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="px-3 py-1 rounded-full bg-orange-500/90 text-white text-xs font-bold tracking-widest shadow-lg">
                      ⚠ SANDBOX — JANGAN SCAN
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Pekerjaan</span>
                  <span className="text-white text-right font-bold">{project?.title}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Harga Dasar</span>
                  <span className="text-white font-bold">{payment.baseAmountFormatted}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Biaya Admin 1%</span>
                  <span className="text-white font-bold">{payment.adminFeeClientFormatted}</span>
                </div>
                {payment.gatewayAdjustment > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[#888888]">Kode Unik / Penyesuaian KlikQRIS</span>
                    <span className="text-white font-bold">{payment.gatewayAdjustmentFormatted}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Total Estimasi MediaVault</span>
                  <span className="text-white font-bold">{payment.amountRequestFormatted}</span>
                </div>
                <div className="h-px bg-[#2A2A2A]" />
                <div className="flex justify-between gap-4 text-base">
                  <span className="text-[#888888]">Total Bayar QRIS</span>
                  <span className="text-[#F5C800] font-bold">{payment.totalAmountFormatted}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Status</span>
                  <span className={payment.status === 'PAID' ? 'text-[#22C55E] font-bold' : 'text-[#F5C800] font-bold'}>
                    {payment.status === 'PAID' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
                  </span>
                </div>
                {payment.expiredAt && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[#888888]">Berlaku Hingga</span>
                    <span className="text-white text-right">
                      {new Date(payment.expiredAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {paymentError && <p className="text-[#EF4444]">{paymentError}</p>}
                {payment.isSandbox && payment.signature && payment.status === 'PENDING' && (
                  <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-400 text-xs font-bold tracking-widest">SANDBOX</span>
                      <span className="text-[#888888] text-xs">— Transaction Signature Key</span>
                    </div>
                    <p className="text-xs text-[#888888] mb-2">
                      Salin signature ini ke halaman <strong className="text-orange-400">Sandbox Transactions</strong> di dashboard KlikQRIS untuk simulasi pembayaran sukses.
                    </p>
                    <code className="block text-xs text-white break-all bg-[#0A0A0A] rounded-md p-2 select-all">{payment.signature}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(payment.signature || '')}
                      className="mt-3 px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-400 transition-colors"
                    >
                      Copy Signature
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setPaymentError('');
                        const response = await apiRequest<{ payment: PaymentDetail }>(`/payments/${payment.klikqrisOrderId}/status`);
                        setPayment(response.payment);
                      } catch (err) {
                        setPaymentError(err instanceof Error ? err.message : 'Gagal refresh status pembayaran');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Status
                  </button>
                  {payment.directUrl && (
                    <a
                      href={payment.directUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#F5C800] text-black rounded-lg text-sm font-bold"
                    >
                      Buka Halaman Bayar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
