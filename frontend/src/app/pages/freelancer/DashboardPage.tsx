import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Briefcase, DollarSign, FileText, Eye, Camera } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

interface Project {
  id: string;
  client: string;
  title: string;
  status: string;
  statusColor: string;
  progress: number;
  rawStatus?: string;
  due: string;
  amount?: string;
  category?: string;
  serviceType?: string | null;
}

interface FreelancerDashboardResponse {
  stats: {
    activeProjects: number;
    pendingPayment: string;
    openRequests: number;
    unreadMessages: number;
    walletBalance: string;
  };
  projects: Project[];
  requests: Project[];
  activities: Array<{ text: string; time: string }>;
}

export default function FreelancerDashboard() {
  const [dashboard, setDashboard] = useState<FreelancerDashboardResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<FreelancerDashboardResponse>('/dashboard/freelancer')
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'));
  }, []);

  const statsData = dashboard?.stats;
  const stats = [
    { label: 'Active Projects', value: String(statsData?.activeProjects ?? 0), icon: Briefcase, color: 'text-[#F5C800]', border: 'border-[#F5C800]' },
    { label: 'Pending Earnings', value: statsData?.pendingPayment ?? 'Rp 0', icon: DollarSign, color: 'text-[#F5C800]', border: 'border-[#F5C800]' },
    { label: 'Saldo Tersedia', value: statsData?.walletBalance ?? 'Rp 0', icon: DollarSign, color: 'text-[#22C55E]', border: 'border-[#22C55E]' },
    { label: 'New Requests', value: String(statsData?.openRequests ?? 0), icon: FileText, color: 'text-[#3B82F6]', border: 'border-[#3B82F6]' },
    { label: 'Unread Messages', value: String(statsData?.unreadMessages ?? 0), icon: Eye, color: 'text-[#22C55E]', border: 'border-[#22C55E]' },
  ];

  const projects = dashboard?.projects ?? [];
  const newRequests = dashboard?.requests ?? [];
  const activities = dashboard?.activities ?? [];

  return (
    <DashboardLayout userType="freelancer">
      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#F5C800] transition-all border-l-4"
            style={{ borderLeftColor: stat.border.replace('border-', '') }}
          >
            <div className="flex items-start justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-[#888888] text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Your Active Projects
            </h2>
            <div className="space-y-4">
              {!dashboard && <EmptyState title="Memuat project" description="Mengambil data project dari backend." />}
              {dashboard && projects.length === 0 && (
                <EmptyState title="Belum ada project aktif" description="Project yang menerima Anda sebagai freelancer akan muncul di sini." />
              )}
              {projects.map((project) => (
                <div key={project.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center">
                        <Camera className="w-5 h-5 text-[#F5C800]" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{project.client}</div>
                        <div className="text-sm text-[#888888]">{project.title}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${project.statusColor}`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#888888]">Progress</span>
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
                    <div className="text-sm text-[#888888]">Due: {project.due}</div>
                    <div className="flex gap-2">
                      <Link
                        to={`/dashboard/freelancer/projects/${project.id}`}
                        className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        to="/dashboard/freelancer/messages"
                        className="px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                New Requests
              </h2>
              <Link to="/dashboard/freelancer/requests" className="text-[#F5C800] hover:underline font-bold">
                See All
              </Link>
            </div>
            <div className="space-y-4">
              {newRequests.length === 0 && (
                <EmptyState title="Belum ada request" description="Job baru dari client akan muncul di sini setelah tersimpan di database." />
              )}
              {newRequests.map((request) => (
                <div key={request.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#F5C800] transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white mb-1">{request.title}</h4>
                      <p className="text-sm text-[#888888]">by {request.client}</p>
                    </div>
                    <span className="px-3 py-1 bg-[#F5C800] text-black rounded-full text-xs font-bold">
                      {request.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#F5C800] font-bold">{request.amount}</p>
                      <p className="text-xs text-[#888888]">Deadline {request.due}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to="/dashboard/freelancer/requests"
                        className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all"
                      >
                        Request Job
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="text-2xl font-bold text-[#F5C800] mb-1">{statsData?.pendingPayment ?? 'Rp 0'}</div>
              <div className="text-sm text-[#888888]">Pending Earnings</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="text-2xl font-bold text-[#22C55E] mb-1">-</div>
              <div className="text-sm text-[#888888]">Average Rating</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="text-2xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-[#888888]">Projects Completed</div>
            </div>
            <Link
              to="/dashboard/freelancer/portfolio"
              className="block bg-[#F5C800] text-black font-bold rounded-xl p-6 hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all text-center"
            >
              View Public Profile
            </Link>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Recent Activity
              </h3>
              <div className="space-y-4">
                {activities.length === 0 && (
                  <p className="text-sm text-[#888888]">Belum ada aktivitas dari database.</p>
                )}
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-[#F5C800]" />
                    <div>
                      <p className="text-sm text-white">{activity.text}</p>
                      <p className="text-xs text-[#888888] mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
