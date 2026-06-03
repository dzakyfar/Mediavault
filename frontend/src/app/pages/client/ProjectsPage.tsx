import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Camera, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../lib/api';

interface Project {
  id: string;
  freelancer: string;
  title: string;
  category: string;
  serviceType: string | null;
  status: string;
  rawStatus: string;
  statusColor: string;
  progress: number;
  eventDate: string;
  due: string;
  files: number;
  amount: string;
  city: string | null;
  address: string | null;
  pendingOffers: Array<{
    id: string;
    freelancer: string;
    serviceType: string | null;
    message: string | null;
  }>;
}

const normalizeProject = (project: Project): Project => ({
  ...project,
  pendingOffers: project.pendingOffers || [],
});

export default function ClientProjects() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: 'all', label: t('Semua', 'All') },
    { id: 'in-progress', label: t('Dikerjakan', 'In Progress') },
    { id: 'under-review', label: t('Direview', 'Under Review') },
    { id: 'completed', label: t('Selesai', 'Completed') },
    { id: 'waiting-payment', label: t('Menunggu Pembayaran', 'Waiting Payment') },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    apiRequest<{ projects: Project[] }>('/projects/mine?as=client')
      .then((response) => setProjects((response.projects || []).map(normalizeProject)))
      .catch((err) => setError(err instanceof Error ? err.message : t('Gagal memuat project', 'Failed to load projects')))
      .finally(() => setLoading(false));
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

  const deleteProject = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError('');
      await apiRequest(`/projects/${deleteTarget.id}`, { method: 'DELETE' });
      setProjects((current) => current.filter((project) => project.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menghapus project', 'Failed to delete project'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout userType="client">
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('Hapus Proyek?', 'Delete Project?')}
        description={t(`Proyek "${deleteTarget?.title || ''}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`, `Project "${deleteTarget?.title || ''}" will be permanently deleted. This action cannot be undone.`)}
        cancelLabel={t('Batal', 'Cancel')}
        confirmLabel={deleting ? t('Menghapus...', 'Deleting...') : t('Ya, Hapus', 'Yes, Delete')}
        danger
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={deleteProject}
      />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        {t('Proyek Saya', 'My Projects')}
        </h1>
        <Link
          to="/post-job"
          className="flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
        >
          <Plus className="w-5 h-5" />
          {t('Buat Pekerjaan Baru', 'Post New Job')}
        </Link>
      </div>

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
          <EmptyState
            title={t('Tidak ada project', 'No projects found')}
            description={t('Proyek yang Anda buat akan tampil di sini.', 'Projects you create will appear here.')}
            action={(
              <Link to="/post-job" className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg">
                <Plus className="w-4 h-4" />
                {t('Buat Pekerjaan Baru', 'Post New Job')}
              </Link>
            )}
          />
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
                    {t('Freelancer', 'Freelancer')}: {project.freelancer}
                  </div>
                  <span>{t('Lokasi', 'Location')}: {project.city || '-'}</span>
                  <span>{t('Jasa', 'Service')}: {project.serviceType || project.category}</span>
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
                <span className="text-[#888888]">{project.amount}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/client/projects/${project.id}`}
                  className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                >
                  {t('Lihat Detail', 'View Details')}
                </Link>
                {project.rawStatus === 'WAITING_PAYMENT' && (
                  <span className="px-4 py-2 bg-[#2A2A2A] text-[#888888] font-bold rounded-lg text-sm cursor-not-allowed">
                    {t('Pembayaran Menyusul', 'Payment Coming Soon')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(project)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm font-bold hover:bg-[#EF4444] hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('Hapus Proyek', 'Delete Project')}
                </button>
              </div>
            </div>

            {project.pendingOffers.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#2A2A2A] flex items-center justify-between gap-4 bg-[#141414] rounded-lg p-4">
                <div>
                  <h4 className="font-bold text-white">{t(`${project.pendingOffers.length} freelancer mengajukan request`, `${project.pendingOffers.length} freelancer${project.pendingOffers.length === 1 ? '' : 's'} sent a request`)}</h4>
                  <p className="text-sm text-[#888888]">{t('Buka detail untuk membaca pesan, melihat profil, dan memilih freelancer.', 'Open details to read messages, view profiles, and choose a freelancer.')}</p>
                </div>
                <Link
                  to={`/dashboard/client/projects/${project.id}`}
                  className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all"
                >
                  {t('Review Permintaan', 'Review Requests')}
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
