import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ProjectTracker from '../../components/dashboard/ProjectTracker';
import ProjectReviewPanel, { ProjectSubmission } from '../../components/dashboard/ProjectReviewPanel';
import { apiRequest } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

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
  eventDate: string;
  due: string;
  status: string;
  statusColor: string;
  amount: string;
  client: string;
  clientId: string;
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
}

const normalizeProjectDetail = (project: ProjectDetail): ProjectDetail => ({
  ...project,
  tracking: project.tracking || [],
  histories: project.histories || [],
  submissions: project.submissions || [],
  referenceFiles: project.referenceFiles || [],
});

export default function FreelancerProjectDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiRequest<{ project: ProjectDetail }>(`/projects/${id}`)
      .then((response) => setProject(normalizeProjectDetail(response.project)))
      .catch((err) => setError(err instanceof Error ? err.message : t('Gagal memuat detail proyek', 'Failed to load project details')))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout userType="freelancer">
      <Link to="/dashboard/freelancer/projects" className="text-[#888888] hover:text-[#F5C800] transition-colors">
        {t('Kembali ke proyek', 'Back to projects')}
      </Link>
      <div className="mt-8">
        {loading && <EmptyState title={t('Memuat proyek', 'Loading project')} description={t('Menyiapkan detail proyek dan progres terbaru.', 'Preparing project details and latest progress.')} />}
        {error && <EmptyState title={t('Proyek tidak ditemukan', 'Project not found')} description={error} />}
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
                  <div className="text-[#888888] mb-1">{t('Klien', 'Client')}</div>
                  <div className="text-white font-bold">{project.client}</div>
                  {project.clientId && (
                    <Link
                      to={`/dashboard/freelancer/messages?peerId=${project.clientId}&peerName=${encodeURIComponent(project.client)}`}
                      className="inline-block mt-3 px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      {t('Chat Klien', 'Chat Client')}
                    </Link>
                  )}
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">{t('Jasa', 'Service')}</div>
                  <div className="text-white font-bold">{project.serviceType || project.category}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">{t('Tanggal Pelaksanaan', 'Event Date')}</div>
                  <div className="text-white font-bold">{project.eventDate}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">Deadline</div>
                  <div className="text-white font-bold">{project.due}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4">
                  <div className="text-[#888888] mb-1">{t('Budget/Harga', 'Budget/Price')}</div>
                  <div className="text-[#F5C800] font-bold">{project.amount}</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-4 md:col-span-2">
                  <div className="text-[#888888] mb-1">{t('Lokasi', 'Location')}</div>
                  <div className="text-white font-bold">
                    {[project.village, project.district, project.city, project.province].filter(Boolean).join(', ') || '-'}
                  </div>
                  <p className="text-[#888888] mt-2">{project.addressDetail || project.address || '-'}</p>
                  {project.postalCode && <p className="text-[#888888] mt-1">{t('Kode Pos:', 'Postal Code:')} {project.postalCode}</p>}
                  {project.latitude && project.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-[#F5C800] hover:underline"
                    >
                      {t('Buka Maps', 'Open Maps')}
                    </a>
                  )}
                </div>
              </div>
            </div>
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
                  {t('File Referensi', 'Reference Files')}
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
            <ProjectReviewPanel
              projectId={project.id}
              userType="freelancer"
              projectStatus={project.status}
              submissions={project.submissions}
              onUpdated={(updatedProject) => setProject(updatedProject as ProjectDetail)}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
