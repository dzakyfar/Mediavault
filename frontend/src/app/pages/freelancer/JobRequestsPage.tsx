import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

interface RequestProject {
  id: string;
  title: string;
  client: string;
  amount: string;
  category: string;
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
  const { user } = useAuth();

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
  ];

  const loadOpenProjects = () => {
    setLoading(true);
    apiRequest<{ projects: RequestProject[] }>('/projects/open')
      .then((response) => setRequests(response.projects))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat job request'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOpenProjects();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesQuery = `${request.title} ${request.client} ${request.city} ${request.serviceType}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = !categoryFilter || request.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const openRequestModal = (request: RequestProject) => {
    setError('');
    setSuccess('');
    setSelectedRequest(request);
    setRequestMessage(`Saya ingin request job "${request.title}" untuk jasa ${request.serviceType || request.category}.`);
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
      setSuccess('Request job terkirim. Job tetap tampil sampai client memilih freelancer.');
      await loadOpenProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal request job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="freelancer">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Job Requests
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
          placeholder="Search title, client, city, service..."
          className="md:col-span-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
        >
          <option value="">All Categories</option>
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
        {loading && <EmptyState title="Memuat request" description="Mengambil job terbuka dari database." />}
        {!loading && filteredRequests.length === 0 && (
          <EmptyState title="Belum ada request" description="Job request dari client akan tampil di sini setelah ada project OPEN di database." />
        )}
        {filteredRequests.map((request) => {
          const alreadyRequested = request.pendingOffers?.some((offer) => offer.freelancerId === user?.id);

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
                <p className="text-sm text-[#888888] mb-3">by {request.client} • {request.city || '-'}</p>
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
                  <span className="text-[#888888]">Budget: </span>
                  <span className="text-[#F5C800] font-bold">{request.amount}</span>
                </div>
                <span className="text-[#888888]">📅 Deadline: {request.due}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openRequestModal(request)}
                  disabled={alreadyRequested}
                  className={`px-6 py-2 font-bold rounded-lg transition-all ${
                    alreadyRequested
                      ? 'bg-[#2A2A2A] text-[#888888] cursor-not-allowed'
                      : 'bg-[#F5C800] text-black hover:shadow-[0_0_10px_rgba(245,200,0,0.4)]'
                  }`}
                >
                  {alreadyRequested ? 'Requested' : 'Request Job'}
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <h2 className="text-3xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Request Job
            </h2>
            <p className="text-[#888888] mb-4">
              Kirim pesan singkat ke client untuk job {selectedRequest.title}.
            </p>
            <textarea
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              rows={5}
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              placeholder="Tulis pesan untuk client..."
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRequestJob}
                disabled={submitting}
                className="px-5 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
