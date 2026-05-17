import { Link } from 'react-router';
import { Briefcase, CreditCard, FolderOpen, MessageCircle, Plus, Camera, Star } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function ClientDashboard() {
  const stats = [
    { label: 'Active Projects', value: '3', icon: Briefcase, color: 'text-[#F5C800]', border: 'border-[#F5C800]', link: '/dashboard/client/projects' },
    { label: 'Pending Payment', value: 'Rp 1.500.000', icon: CreditCard, color: 'text-[#F5C800]', border: 'border-[#F5C800]', link: '/dashboard/client/payments' },
    { label: 'Files Ready', value: '7 Files', icon: FolderOpen, color: 'text-[#22C55E]', border: 'border-[#22C55E]', link: '#' },
    { label: 'Unread Messages', value: '5', icon: MessageCircle, color: 'text-[#3B82F6]', border: 'border-[#3B82F6]', link: '/dashboard/client/messages' },
  ];

  const projects = [
    { id: '1', freelancer: 'Fauzan A.', title: 'Brand Product Shoot — Maret 2026', status: 'In Progress', progress: 60, due: '10 Mar 2026', statusColor: 'bg-[#F5C800] text-black' },
    { id: '2', freelancer: 'Nathanael V.', title: 'Wedding Documentation — Rania & Budi', status: 'Under Review', progress: 90, due: '5 Mar 2026', statusColor: 'bg-[#3B82F6] text-white' },
    { id: '3', freelancer: 'Dzaky F.', title: 'Corporate Headshots — PT. Maju Jaya', status: 'Waiting Payment', progress: 100, due: '1 Mar 2026', statusColor: 'bg-[#F97316] text-white' },
  ];

  const activities = [
    { icon: '🟡', text: 'Fauzan uploaded 3 files to Brand Product Shoot', time: '2 hours ago' },
    { icon: '🟢', text: 'Payment of Rp 500K confirmed for Wedding Doc', time: 'Yesterday' },
    { icon: '🟡', text: 'New message from Nathanael V.', time: 'Yesterday' },
    { icon: '⚪', text: 'Project "Corporate Headshots" marked complete', time: '3 days ago' },
    { icon: '⚪', text: 'Invoice #INV-2026-003 generated', time: '4 days ago' },
  ];

  return (
    <DashboardLayout userType="client" userName="Rania K.">
      <div className="grid grid-cols-4 gap-6 mb-8">
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
              Your Active Projects
            </h2>
            <Link
              to="/post-job"
              className="flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </Link>
          </div>

          <div className="space-y-4">
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
                  <div className="text-sm text-[#888888]">📅 Due: {project.due}</div>
                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/client/projects/${project.id}`}
                      className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      to="/dashboard/client/messages"
                      className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Handpicked for You
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Sarah D.', specialty: 'Product Photography', rating: '5.0', price: 'Rp 650K', available: true },
                { name: 'Michael T.', specialty: 'Event Coverage', rating: '4.8', price: 'Rp 700K', available: true }
              ].map((freelancer, i) => (
                <div key={i} className="bg-[#141414] rounded-xl p-4 border border-[#2A2A2A] hover:border-[#F5C800] transition-all">
                  <div className="relative w-full aspect-square bg-[#1A1A1A] rounded-lg mb-3 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-[#888888]" />
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {freelancer.available ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#22C55E] text-white rounded-full text-xs font-bold">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          Available
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#888888] text-white rounded-full text-xs font-bold">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          Busy
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold mb-1">{freelancer.name}</h4>
                  <p className="text-sm text-[#888888] mb-2">{freelancer.specialty}</p>
                  <div className="flex items-center gap-1 mb-2 text-sm">
                    <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                    <span>{freelancer.rating}</span>
                  </div>
                  <p className="text-[#F5C800] font-bold text-sm mb-3">From {freelancer.price}</p>
                  <Link
                    to={`/freelancer/${i + 5}`}
                    className="block w-full px-3 py-2 border border-[#888888] rounded-lg text-sm text-center hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Recent Activity
          </h2>
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ backgroundColor: activity.icon === '🟡' ? '#F5C800' : activity.icon === '🟢' ? '#22C55E' : '#888888' }}></div>
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
