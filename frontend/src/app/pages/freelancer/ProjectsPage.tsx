import { useState } from 'react';
import { Link } from 'react-router';
import { Camera, Upload } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function FreelancerProjects() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending-review', label: 'Pending Review' },
  ];

  const projects = [
    { id: '1', client: 'Rania K.', title: 'Brand Product Shoot', status: 'In Progress', progress: 60, due: '10 Mar 2026', files: 3, amount: 'Rp 1.500.000', statusColor: 'bg-[#F5C800] text-black' },
    { id: '2', client: 'Budi S.', title: 'Corporate Event Coverage', status: 'Pending Review', progress: 100, due: '5 Mar 2026', files: 15, amount: 'Rp 2.000.000', statusColor: 'bg-[#3B82F6] text-white' },
    { id: '3', client: 'Sarah M.', title: 'Fashion Editorial Shoot', status: 'Completed', progress: 100, due: '1 Mar 2026', files: 20, amount: 'Rp 2.500.000', statusColor: 'bg-[#22C55E] text-white' },
  ];

  return (
    <DashboardLayout userType="freelancer" userName="Fauzan A.">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        My Projects
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

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                <div className="flex items-center gap-3 text-sm text-[#888888]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center">
                      <Camera className="w-4 h-4 text-[#F5C800]" />
                    </div>
                    for {project.client}
                  </div>
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
                <span className="text-[#888888]">📅 Deadline: {project.due}</span>
                <span className="text-[#888888]">📁 {project.files} Files Uploaded</span>
                <span className="text-[#F5C800] font-bold">{project.amount}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/freelancer/projects/${project.id}`}
                  className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                >
                  View Detail
                </Link>
                {project.status === 'In Progress' && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all">
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </button>
                )}
                {project.status === 'Completed' && (
                  <button className="px-4 py-2 bg-[#22C55E] text-white font-bold rounded-lg text-sm">
                    Request Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
