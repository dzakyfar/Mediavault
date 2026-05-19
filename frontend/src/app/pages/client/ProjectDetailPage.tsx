import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ProjectTracker from '../../components/dashboard/ProjectTracker';
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
}

export default function ClientProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiRequest<{ project: ProjectDetail }>(`/projects/${id}`)
      .then((response) => setProject(response.project))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat detail project'))
      .finally(() => setLoading(false));
  }, [id]);

  const respondOffer = async (applicationId: string, action: 'accept' | 'decline') => {
    if (!id) return;
    await apiRequest(`/projects/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    const response = await apiRequest<{ project: ProjectDetail }>(`/projects/${id}`);
    setProject(response.project);
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

            <ProjectTracker
              projectId={project.id}
              stages={project.tracking}
              histories={project.histories}
              canUpdate={Boolean(project.freelancer && project.freelancer !== 'Belum ada freelancer')}
              onUpdated={(updatedProject) => setProject(updatedProject as ProjectDetail)}
            />

            {project.pendingOffers.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Pending Freelancer Requests</h2>
                <div className="space-y-3">
                  {project.pendingOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between gap-4 bg-[#141414] rounded-lg p-4">
                      <div>
                        <div className="font-bold text-white">{offer.freelancer}</div>
                        <div className="text-sm text-[#888888]">{offer.serviceType || project.serviceType || 'Jasa kreatif'}</div>
                        {offer.message && <p className="text-sm text-[#888888] mt-1">{offer.message}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => respondOffer(offer.id, 'accept')} className="px-4 py-2 bg-[#22C55E] text-white rounded-lg text-sm font-bold">
                          Accept Offer
                        </button>
                        <button onClick={() => respondOffer(offer.id, 'decline')} className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
