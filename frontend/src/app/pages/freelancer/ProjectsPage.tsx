import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Camera, MapPin, Upload } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../lib/api';
import { buildGoogleMapsSearchUrl, buildGoogleMapsEmbedUrl } from '../../lib/googleMaps';

interface Project {
  id: string;
  client: string;
  title: string;
  serviceType: string | null;
  status: string;
  rawStatus: string;
  progress: number;
  eventDate: string;
  due: string;
  files: number;
  amount: string;
  statusColor: string;
  province: string | null;
  city: string | null;
  district: string | null;
  village: string | null;
  postalCode: string | null;
  address: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function FreelancerProjects() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'all', label: t('Semua', 'All') },
    { id: 'paid', label: t('Perlu Konfirmasi', 'Needs Confirmation') },
    { id: 'in-progress', label: t('Dikerjakan', 'In Progress') },
    { id: 'completed', label: t('Selesai', 'Completed') },
    { id: 'under-review', label: t('Direview', 'Under Review') },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    apiRequest<{ projects: Project[] }>('/projects/mine?as=freelancer')
      .then((response) => setProjects(response.projects))
      .catch((err) => setError(err instanceof Error ? err.message : t('Gagal memuat project', 'Failed to load projects')))
      .finally(() => setLoading(false));
  };

  const confirmProject = async (projectId: string) => {
    try {
      setError('');
      await apiRequest(`/projects/${projectId}/freelancer-confirm`, {
        method: 'PATCH',
      });
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyetujui project', 'Failed to accept project'));
    }
  };

  const rejectProject = async (projectId: string) => {
    try {
      setError('');
      await apiRequest(`/projects/${projectId}/freelancer-reject`, {
        method: 'PATCH',
      });
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menolak project', 'Failed to reject project'));
    }
  };

  const filteredProjects = activeTab === 'all'
    ? projects
    : projects.filter((project) => project.rawStatus.toLowerCase().replaceAll('_', '-') === activeTab);
  const statusLabel = (status: string) => {
    const normalized = status.toLowerCase().replaceAll('_', ' ');
    const labels: Record<string, string> = {
      open: t('Terbuka', 'Open'),
      'in progress': t('Dikerjakan', 'In Progress'),
      confirmed: t('Dikonfirmasi', 'Confirmed'),
      paid: t('Dibayar', 'Paid'),
      'under review': t('Direview', 'Under Review'),
      'waiting payment': t('Menunggu Pembayaran', 'Waiting Payment'),
      delivered: t('Dikirim', 'Delivered'),
      completed: t('Selesai', 'Completed'),
      cancelled: t('Dibatalkan', 'Cancelled'),
    };
    return labels[normalized] || status;
  };

  return (
    <DashboardLayout userType="freelancer">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        {t('Proyek Saya', 'My Projects')}
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

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && <EmptyState title={t('Memuat proyek', 'Loading projects')} description={t('Menyiapkan daftar proyek terbaru Anda.', 'Preparing your latest project list.')} />}
        {!loading && filteredProjects.length === 0 && (
          <EmptyState title={t('Belum ada proyek', 'No projects yet')} description={t('Proyek akan tampil di sini setelah klien memilih Anda sebagai freelancer.', 'Projects will appear here after clients choose you as freelancer.')} />
        )}
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                <div className="flex items-center gap-3 text-sm text-[#888888]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center">
                      <Camera className="w-4 h-4 text-[#F5C800]" />
                    </div>
                    {t('Untuk', 'For')} {project.client}
                  </div>
                  <span>{t('Jasa', 'Service')}: {project.serviceType || t('Jasa kreatif', 'Creative service')}</span>
                </div>
                {/* Location section with map */}
                <div className="mt-3 bg-[#141414] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[#888888] text-xs mb-1 uppercase tracking-wide">{t('Lokasi', 'Location')}</div>
                      <div className="text-white font-bold text-sm">
                        {[project.village, project.district, project.city, project.province].filter(Boolean).join(', ') || '-'}
                      </div>
                      {(project.addressDetail || project.address) && (
                        <p className="text-[#888888] text-sm mt-1">{project.addressDetail || project.address}</p>
                      )}
                      {project.postalCode && (
                        <p className="text-[#888888] text-xs mt-1">{t('Kode Pos:', 'Postal Code:')} {project.postalCode}</p>
                      )}
                      {project.latitude != null && project.longitude != null && (
                        <a
                          href={buildGoogleMapsSearchUrl(`${project.latitude},${project.longitude}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-[#F5C800] text-sm hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {t('Buka di Google Maps', 'Open in Google Maps')}
                        </a>
                      )}
                    </div>
                    {/* Embedded map preview */}
                    {project.latitude != null && project.longitude != null && (
                      <a
                        href={buildGoogleMapsSearchUrl(`${project.latitude},${project.longitude}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden border border-[#2A2A2A] hover:border-[#F5C800] transition-colors"
                        title={t('Klik untuk buka Maps', 'Click to open Maps')}
                      >
                        <iframe
                          title={`Map for ${project.title}`}
                          src={buildGoogleMapsEmbedUrl(`${project.latitude},${project.longitude}`, 15)}
                          width="128"
                          height="96"
                          style={{ border: 0, pointerEvents: 'none' }}
                          loading="lazy"
                        />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${project.statusColor}`}>
                {statusLabel(project.status)}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#888888]">{t('Progress', 'Progress')}</span>
                <span className="text-[#F5C800] font-bold">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F5C800] rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 text-sm">
                <span className="text-[#888888]">{t('Pelaksanaan', 'Event date')}: {project.eventDate}</span>
                <span className="text-[#888888]">{t('Deadline', 'Deadline')}: {project.due}</span>
                <span className="text-[#888888]">{t(`${project.files} file diupload`, `${project.files} file${project.files === 1 ? '' : 's'} uploaded`)}</span>
                <span className="text-[#F5C800] font-bold">{project.amount}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/freelancer/projects/${project.id}`}
                  className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                >
                  {t('Lihat Detail', 'View Details')}
                </Link>
                {project.rawStatus === 'PAID' && (
                  <>
                    <button
                      onClick={() => confirmProject(project.id)}
                      className="px-4 py-2 bg-[#22C55E] text-white font-bold rounded-lg text-sm hover:bg-[#16A34A] transition-colors"
                    >
                      {t('Terima Order', 'Accept Order')}
                    </button>
                    <button
                      onClick={() => rejectProject(project.id)}
                      className="px-4 py-2 border border-[#EF4444] text-[#EF4444] font-bold rounded-lg text-sm hover:bg-[#EF4444] hover:text-white transition-colors"
                    >
                      {t('Tolak', 'Reject')}
                    </button>
                  </>
                )}
                {['IN_PROGRESS', 'CONFIRMED'].includes(project.rawStatus) && (
                  <Link
                    to={`/dashboard/freelancer/projects/${project.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {t('Upload Hasil', 'Upload Result')}
                  </Link>
                )}
                {project.rawStatus === 'COMPLETED' && (
                  <span className="px-4 py-2 bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40 font-bold rounded-lg text-sm">
                    {t('Selesai & Dana Dicairkan', 'Completed & Funds Released')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
