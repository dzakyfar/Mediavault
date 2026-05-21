import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Camera } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
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

export default function ClientProjects() {
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'under-review', label: 'Under Review' },
    { id: 'completed', label: 'Completed' },
    { id: 'waiting-payment', label: 'Waiting Payment' },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    apiRequest<{ projects: Project[] }>('/projects/mine?as=client')
      .then((response) => setProjects(response.projects))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat project'))
      .finally(() => setLoading(false));
  };

  const filteredProjects = activeTab === 'all'
    ? projects
    : projects.filter((project) => project.rawStatus.toLowerCase().replaceAll('_', '-') === activeTab);

  return (
    <DashboardLayout userType="client">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          My Projects
        </h1>
        <Link
          to="/post-job"
          className="flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
        >
          <Plus className="w-5 h-5" />
          Post New Job
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
        {loading && <EmptyState title="Memuat project" description="Mengambil daftar project dari backend." />}

        {!loading && filteredProjects.length === 0 && (
          <EmptyState
            title="Tidak ada project"
            description="Project dari database akan muncul di sini setelah Anda membuat job baru."
            action={(
              <Link to="/post-job" className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg">
                <Plus className="w-4 h-4" />
                Post New Job
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
                    by {project.freelancer}
                  </div>
                  <span>📍 {project.city || '-'}</span>
                  <span>🎯 {project.serviceType || project.category}</span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${project.statusColor}`}>
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

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 text-sm">
                <span className="text-[#888888]">📅 Pelaksanaan: {project.eventDate}</span>
                <span className="text-[#888888]">⏳ Deadline: {project.due}</span>
                <span className="text-[#888888]">📁 {project.files} Files Uploaded</span>
                <span className="text-[#888888]">💳 {project.amount}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/client/projects/${project.id}`}
                  className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                >
                  View Detail
                </Link>
                {project.status === 'Waiting Payment' && (
                  <Link
                    to="/dashboard/client/payments"
                    className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all"
                  >
                    Pay Now
                  </Link>
                )}
              </div>
            </div>

            {project.pendingOffers.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#2A2A2A] flex items-center justify-between gap-4 bg-[#141414] rounded-lg p-4">
                <div>
                  <h4 className="font-bold text-white">{project.pendingOffers.length} freelancer request job ini</h4>
                  <p className="text-sm text-[#888888]">Buka detail untuk message, lihat profil, dan confirm freelancer.</p>
                </div>
                <Link
                  to={`/dashboard/client/projects/${project.id}`}
                  className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all"
                >
                  Review
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
