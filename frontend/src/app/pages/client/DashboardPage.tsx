import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Briefcase, CreditCard, FolderOpen, MessageCircle, Plus, Camera, Star, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import UserAvatar from '../../components/UserAvatar';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../lib/api';

interface DashboardProject {
  id: string;
  freelancer: string;
  title: string;
  serviceType: string | null;
  status: string;
  statusColor: string;
  progress: number;
  eventDate: string;
  due: string;
  city: string | null;
  address: string | null;
  pendingOffers: Array<{
    id: string;
    freelancer: string;
    serviceType: string | null;
    message: string | null;
  }>;
}

interface FreelancerCard {
  id: string;
  name: string;
  avatarUrl?: string | null;
  specialty: string;
  rating: string | null;
  reviewCount: number;
  price: string;
  available: boolean;
}

interface ClientDashboardResponse {
  stats: {
    activeProjects: number;
    pendingPayment: string;
    filesReady: number;
    unreadMessages: number;
    walletBalance: string;
  };
  projects: DashboardProject[];
  activities: Array<{ text: string; time: string }>;
  recommendedFreelancers: FreelancerCard[];
}

const normalizeDashboard = (dashboard: ClientDashboardResponse): ClientDashboardResponse => ({
  ...dashboard,
  projects: (dashboard.projects || []).map((project) => ({
    ...project,
    pendingOffers: project.pendingOffers || [],
  })),
  activities: dashboard.activities || [],
  recommendedFreelancers: dashboard.recommendedFreelancers || [],
});

export default function ClientDashboard() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState<ClientDashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(() => {
      if (!document.hidden) loadDashboard(true);
    }, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const loadDashboard = (silent = false) => {
    apiRequest<ClientDashboardResponse>('/dashboard/client')
      .then((response) => {
        setDashboard(normalizeDashboard(response));
        setError('');
      })
      .catch((err) => {
        if (!silent) setError(err instanceof Error ? err.message : t('Gagal memuat dasbor', 'Failed to load dashboard'));
      });
  };

  const statsData = dashboard?.stats;
  const stats = [
    { label: t('Proyek Aktif', 'Active Projects'), value: String(statsData?.activeProjects ?? 0), icon: Briefcase, color: 'text-[#F5C800]', border: 'border-[#F5C800]', link: '/dashboard/client/projects' },
    { label: t('Menunggu Pembayaran', 'Pending Payment'), value: statsData?.pendingPayment ?? 'Rp 0', icon: CreditCard, color: 'text-[#F5C800]', border: 'border-[#F5C800]', link: '/dashboard/client/payments' },
    { label: t('Saldo Klien', 'Client Balance'), value: statsData?.walletBalance ?? 'Rp 0', icon: Wallet, color: 'text-[#22C55E]', border: 'border-[#22C55E]', link: '/dashboard/client/payments' },
    { label: t('File Siap Review', 'Files Ready For Review'), value: t(`${statsData?.filesReady ?? 0} file`, `${statsData?.filesReady ?? 0} file${(statsData?.filesReady ?? 0) === 1 ? '' : 's'}`), icon: FolderOpen, color: 'text-[#22C55E]', border: 'border-[#22C55E]', link: '/dashboard/client/projects' },
    { label: t('Pesan Belum Dibaca', 'Unread Messages'), value: String(statsData?.unreadMessages ?? 0), icon: MessageCircle, color: 'text-[#3B82F6]', border: 'border-[#3B82F6]', link: '/dashboard/client/messages' },
  ];

  const projects = dashboard?.projects ?? [];
  const activities = dashboard?.activities ?? [];
  const recommendedFreelancers = dashboard?.recommendedFreelancers ?? [];
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
    <DashboardLayout userType="client">
      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Link
            key={i}
            to={stat.link}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#F5C800] transition-all border-l-4"
            style={{ borderLeftColor: stat.border.replace('border-', '') }}
          >
            <div className="flex items-start justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-[#888888] text-sm">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {t('Proyek Aktif', 'Active Projects')}
            </h2>
            <Link
              to="/post-job"
              className="flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('Buat Pekerjaan Baru', 'Post New Job')}
            </Link>
          </div>

          <div className="space-y-4">
            {!dashboard && <EmptyState title={t('Memuat dasbor', 'Loading dashboard')} description={t('Menyiapkan ringkasan proyek terbaru untuk Anda.', 'Preparing your latest project summary.')} />}

            {dashboard && projects.length === 0 && (
              <EmptyState
                title={t('Belum ada proyek', 'No projects yet')}
                description={t('Mulai dengan membuat pekerjaan pertama agar freelancer bisa mengirim penawaran.', 'Start by creating your first job so freelancers can send offers.')}
                action={(
                  <Link to="/post-job" className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg">
                    <Plus className="w-4 h-4" />
                    {t('Buat Pekerjaan Baru', 'Post New Job')}
                  </Link>
                )}
              />
            )}

            {projects.map((project) => (
              <div key={project.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center">
                      <Camera className="w-5 h-5 text-[#F5C800]" />
                    </div>
                      <div>
                        <div className="font-bold text-white">{project.freelancer}</div>
                        <div className="text-sm text-[#888888]">{project.title}</div>
                        <div className="text-xs text-[#888888] mt-1">
                          {project.serviceType || t('Jasa kreatif', 'Creative service')} - {project.city || '-'}
                        </div>
                      </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${project.statusColor}`}>
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

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#888888]">{t('Pelaksanaan', 'Event date')}: {project.eventDate} - {t('Deadline', 'Deadline')}: {project.due}</div>
                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/client/projects/${project.id}`}
                      className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      {t('Detail', 'Details')}
                    </Link>
                  </div>
                </div>

                {project.pendingOffers.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-[#2A2A2A] flex items-center justify-between gap-4 bg-[#141414] rounded-lg p-4">
                    <div>
                      <div className="font-bold text-white">{t(`${project.pendingOffers.length} freelancer mengajukan request`, `${project.pendingOffers.length} freelancer${project.pendingOffers.length === 1 ? '' : 's'} sent a request`)}</div>
                      <div className="text-sm text-[#888888]">{t('Buka detail untuk membaca pesan, melihat profil, lalu memilih freelancer.', 'Open details to read messages, view profiles, and choose a freelancer.')}</div>
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

          <div className="mt-8">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {t('Rekomendasi Freelancer', 'Recommended Freelancers')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {recommendedFreelancers.length === 0 && (
                <div className="col-span-2">
                  <EmptyState title={t('Belum ada rekomendasi', 'No recommendations yet')} description={t('Rekomendasi freelancer akan muncul setelah ada profil yang sesuai dengan kebutuhan Anda.', 'Freelancer recommendations will appear once matching profiles are available.')} />
                </div>
              )}

              {recommendedFreelancers.map((freelancer) => (
                <div key={freelancer.id} className="bg-[#141414] rounded-xl p-4 border border-[#2A2A2A] hover:border-[#F5C800] transition-all">
                  <div className="relative w-full aspect-square bg-[#1A1A1A] rounded-lg mb-3 flex items-center justify-center">
                    <UserAvatar name={freelancer.name} src={freelancer.avatarUrl} className="h-20 w-20 text-2xl" />
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {freelancer.available ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#22C55E] text-white rounded-full text-xs font-bold">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          {t('Tersedia', 'Available')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#888888] text-white rounded-full text-xs font-bold">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          {t('Sibuk', 'Busy')}
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold mb-1">{freelancer.name}</h4>
                  <p className="text-sm text-[#888888] mb-2">{freelancer.specialty}</p>
                  <div className="flex items-center gap-1 mb-2 text-sm">
                    <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                    <span>{freelancer.rating ?? t('Baru', 'New')}</span>
                    {freelancer.reviewCount > 0 && <span className="text-[#888888]">({freelancer.reviewCount})</span>}
                  </div>
                  <p className="text-[#F5C800] font-bold text-sm mb-3">{t('Mulai dari', 'From')} {freelancer.price}</p>
                  <Link
                    to={`/freelancer/${freelancer.id}`}
                    className="block w-full px-3 py-2 border border-[#888888] text-white rounded-lg text-sm text-center hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                  >
                    {t('Lihat Profil', 'View Profile')}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Aktivitas Terbaru', 'Recent Activity')}
          </h2>
          <div className="space-y-4">
            {activities.length === 0 && (
              <p className="text-sm text-[#888888]">{t('Belum ada update terbaru untuk ditampilkan.', 'No recent updates to show yet.')}</p>
            )}
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-[#F5C800]"></div>
                <div>
                  <p className="text-sm text-white">{activity.text}</p>
                  <p className="text-xs text-[#888888] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
