import { Link } from 'react-router';
import { Briefcase, DollarSign, FileText, Eye, Camera } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function FreelancerDashboard() {
  const stats = [
    { label: 'Active Projects', value: '3', icon: Briefcase, color: 'text-[#F5C800]', border: 'border-[#F5C800]' },
    { label: 'Pending Earnings', value: 'Rp 2.250.000', icon: DollarSign, color: 'text-[#F5C800]', border: 'border-[#F5C800]' },
    { label: 'New Requests', value: '5', icon: FileText, color: 'text-[#3B82F6]', border: 'border-[#3B82F6]' },
    { label: 'Portfolio Views', value: '128', icon: Eye, color: 'text-[#22C55E]', border: 'border-[#22C55E]' },
  ];

  const projects = [
    { id: '1', client: 'Rania K.', title: 'Brand Product Shoot', status: 'In Progress', progress: 60, due: '10 Mar 2026' },
    { id: '2', client: 'Budi S.', title: 'Corporate Event Coverage', status: 'Under Review', progress: 90, due: '5 Mar 2026' },
    { id: '3', client: 'Sarah M.', title: 'Fashion Editorial Shoot', status: 'Completed', progress: 100, due: '1 Mar 2026' },
  ];

  const newRequests = [
    { id: '1', title: 'Wedding Photography - Bali', client: 'Dewi & Ahmad', budget: 'Rp 3.500.000', category: 'Wedding', posted: '2 hours ago' },
    { id: '2', title: 'Product Catalog Shoot', client: 'PT. Maju Jaya', budget: 'Rp 1.200.000', category: 'Product', posted: '5 hours ago' },
  ];

  return (
    <DashboardLayout userType="freelancer" userName="Fauzan A.">
      <div className="grid grid-cols-4 gap-6 mb-8">
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
                    <span className="px-3 py-1 bg-[#F5C800] text-black rounded-full text-sm font-bold">
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
                    <div className="text-sm text-[#888888]">📅 Due: {project.due}</div>
                    <div className="flex gap-2">
                      <Link
                        to={`/dashboard/freelancer/projects/${project.id}`}
                        className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        to="/dashboard/freelancer/messages"
                        className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
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
                See All →
              </Link>
            </div>
            <div className="space-y-4">
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
                      <p className="text-[#F5C800] font-bold">{request.budget}</p>
                      <p className="text-xs text-[#888888]">Posted {request.posted}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all">
                        Accept
                      </button>
                      <button className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg hover:bg-[#EF4444] hover:text-white transition-all">
                        Decline
                      </button>
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
              <div className="text-2xl font-bold text-[#F5C800] mb-1">Rp 12.500.000</div>
              <div className="text-sm text-[#888888]">Total Earned</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="text-2xl font-bold text-[#22C55E] mb-1">4.9 ⭐</div>
              <div className="text-sm text-[#888888]">Average Rating</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="text-2xl font-bold text-white mb-1">47</div>
              <div className="text-sm text-[#888888]">Projects Completed</div>
            </div>
            <Link
              to="/dashboard/freelancer/portfolio"
              className="block bg-[#F5C800] text-black font-bold rounded-xl p-6 hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all text-center"
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
