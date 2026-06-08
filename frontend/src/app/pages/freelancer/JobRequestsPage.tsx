import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../lib/api';

interface RequestProject {
  id: string;
  title: string;
  client: string;
  amount: string;
  category: string;
  status: string;
  description: string;
  due: string;
  city: string | null;
  serviceType: string | null;
  address: string | null;
  pendingOffers: Array<{
    id: string;
    freelancerId: string;
    status: string;
    message: string | null;
  }>;
}

export default function FreelancerJobRequests() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [requests, setRequests] = useState<RequestProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RequestProject | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingApplicationId, setCancellingApplicationId] = useState('');
  const { user } = useAuth();

  const tabs = [
    { id: 'all', label: t('Semua', 'All') },
    { id: 'new', label: t('Terbaru', 'Newest') },
  ];

  const loadOpenProjects = (silent = false) => {
    if (!silent) setLoading(true);
    apiRequest<{ projects: RequestProject[] }>('/projects/open')
      .then((response) => {
        setRequests(response.projects);
        setError('');
      })
      .catch((err) => {
        if (!silent) setError(err instanceof Error ? err.message : t('Gagal memuat permintaan pekerjaan', 'Failed to load job requests'));
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    loadOpenProjects();
    const interval = window.setInterval(() => {
      if (!document.hidden) loadOpenProjects(true);
    }, 8000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesQuery = `${request.title} ${request.client} ${request.city} ${request.serviceType}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = !categoryFilter || request.category === categoryFilter;
    const matchesTab = activeTab === 'all' || request.status === 'Open';
    return matchesQuery && matchesCategory && matchesTab;
  });

  const openRequestModal = (request: RequestProject) => {
    setError('');
    setSuccess('');
    setSelectedRequest(request);
    setRequestMessage(t(`Saya ingin mengajukan permintaan untuk pekerjaan "${request.title}" dengan jasa ${request.serviceType || request.category}.`, `I want to request the job "${request.title}" for ${request.serviceType || request.category}.`));
  };

  const submitRequestJob = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      await apiRequest(`/projects/${selectedRequest.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          serviceType: selectedRequest.serviceType || selectedRequest.category,
          message: requestMessage.trim() || undefined,
        }),
      });
      setSelectedRequest(null);
      setRequestMessage('');
      setSuccess(t('Permintaan pekerjaan terkirim. Pekerjaan tetap tampil sampai klien memilih freelancer.', 'Job request sent. The job will remain visible until the client chooses a freelancer.'));
      await loadOpenProjects();
      window.dispatchEvent(new Event('mediavault:dashboard-refresh'));
      window.dispatchEvent(new Event('mediavault:notifications-refresh'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mengirim permintaan pekerjaan', 'Failed to send job request'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequestJob = async (applicationId: string) => {
    try {
      setCancellingApplicationId(applicationId);
      setError('');
      setSuccess('');
      await apiRequest(`/projects/applications/${applicationId}/cancel`, { method: 'PATCH' });
      setSuccess(t('Permintaan pekerjaan berhasil dibatalkan.', 'Job request cancelled successfully.'));
      await loadOpenProjects();
      window.dispatchEvent(new Event('mediavault:dashboard-refresh'));
      window.dispatchEvent(new Event('mediavault:notifications-refresh'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal membatalkan permintaan pekerjaan', 'Failed to cancel job request'));
    } finally {
      setCancellingApplicationId('');
    }
  };

  return (
    <DashboardLayout userType="freelancer">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        {t('Permintaan Pekerjaan', 'Job Requests')}
      </h1>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#F5C800] text-black'
                : 'bg-[#141414] text-[#888888] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5 mb-6 grid md:grid-cols-3 gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Cari judul, klien, kota, atau jasa...', 'Search title, client, city, or service...')}
          className="md:col-span-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
        >
          <option value="">{t('Semua Kategori', 'All Categories')}</option>
          {[...new Set(requests.map((request) => request.category))].map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-[#22C55E]/10 border border-[#22C55E] rounded-lg text-[#22C55E]">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {loading && <EmptyState title={t('Memuat permintaan', 'Loading requests')} description={t('Mencari peluang pekerjaan terbaru untuk Anda.', 'Looking for the latest job opportunities for you.')} />}
        {!loading && filteredRequests.length === 0 && (
          <EmptyState title={t('Belum ada permintaan', 'No requests yet')} description={t('Belum ada pekerjaan terbuka yang cocok. Halaman ini akan diperbarui otomatis saat ada peluang baru.', 'No matching open jobs yet. This page will update automatically when new opportunities appear.')} />
        )}
        {filteredRequests.map((request) => {
          const currentUserOffer = request.pendingOffers?.find((offer) => offer.freelancerId === user?.id && offer.status === 'PENDING');

          return (
          <div key={request.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{request.title}</h3>
                  <span className="px-3 py-1 bg-[#F5C800] text-black rounded-full text-xs font-bold">
                    {request.category}
                  </span>
                </div>
                <p className="text-sm text-[#888888] mb-3">{t('Dari', 'From')} {request.client} - {request.city || '-'}</p>
                <p className="text-[#888888]">{request.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-[#141414] rounded-full text-[#F5C800]">{request.serviceType || request.category}</span>
                  {request.address && <span className="px-3 py-1 bg-[#141414] rounded-full text-[#888888]">{request.address}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-[#2A2A2A]">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-[#888888]">{t('Budget/Harga', 'Budget/Price')}: </span>
                  <span className="text-[#F5C800] font-bold">{request.amount}</span>
                </div>
                <span className="text-[#888888]">{t('Deadline', 'Deadline')}: {request.due}</span>
              </div>
              <div className="flex gap-2">
                {currentUserOffer ? (
                  <>
                    <span className="px-5 py-2 rounded-lg bg-[#2A2A2A] text-[#888888] font-bold text-sm">
                      {t('Sudah Mengajukan', 'Already Requested')}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelRequestJob(currentUserOffer.id)}
                      disabled={cancellingApplicationId === currentUserOffer.id}
                      className="px-5 py-2 border border-[#EF4444] text-[#EF4444] font-bold rounded-lg text-sm hover:bg-[#EF4444] hover:text-white transition-colors disabled:opacity-60"
                    >
                      {cancellingApplicationId === currentUserOffer.id ? t('Membatalkan...', 'Cancelling...') : t('Batalkan Permintaan', 'Cancel Request')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openRequestModal(request)}
                    className="px-6 py-2 font-bold rounded-lg transition-all bg-[#F5C800] text-black hover:shadow-[0_0_10px_rgba(245,200,0,0.4)]"
                  >
                    {t('Ajukan Permintaan', 'Request Job')}
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {selectedRequest && createPortal((
        <div className="fixed inset-y-0 left-0 right-0 z-50 bg-black/70 flex items-center justify-center p-4 md:left-60">
          <div className="w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <h2 className="text-3xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {t('Ajukan Permintaan', 'Request Job')}
            </h2>
            <p className="text-[#888888] mb-4">
              {t('Kirim pesan singkat ke klien untuk pekerjaan', 'Send a short message to the client for')} {selectedRequest.title}.
            </p>
            <textarea
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              rows={5}
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              placeholder={t('Tulis pesan untuk klien...', 'Write a message for the client...')}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                onClick={submitRequestJob}
                disabled={submitting}
                className="px-5 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm disabled:opacity-60"
              >
                {submitting ? t('Mengirim...', 'Sending...') : t('Kirim Permintaan', 'Send Request')}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </DashboardLayout>
  );
}
