import { Link, useLocation } from 'react-router';
import { Zap, Home, Briefcase, Search, MessageCircle, Bell, CreditCard, Settings, LogOut, FileText, Folder, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardSidebarProps {
  userType: 'client' | 'freelancer';
  userName: string;
}

export default function DashboardSidebar({ userType, userName }: DashboardSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const clientMenuItems = [
    { icon: Home, label: 'Overview', path: '/dashboard/client' },
    { icon: Briefcase, label: 'My Projects', path: '/dashboard/client/projects' },
    { icon: Search, label: 'Find Freelancer', path: '/dashboard/client/find-freelancer' },
    { icon: MessageCircle, label: 'Messages', path: '/dashboard/client/messages' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/client/notifications' },
    { icon: CreditCard, label: 'Payments', path: '/dashboard/client/payments' },
    { icon: Settings, label: 'Settings', path: '/dashboard/client/settings' },
  ];

  const freelancerMenuItems = [
    { icon: Home, label: 'Overview', path: '/dashboard/freelancer' },
    { icon: FileText, label: 'Job Requests', path: '/dashboard/freelancer/requests' },
    { icon: Briefcase, label: 'My Projects', path: '/dashboard/freelancer/projects' },
    { icon: Folder, label: 'Portfolio', path: '/dashboard/freelancer/portfolio' },
    { icon: DollarSign, label: 'Earnings', path: '/dashboard/freelancer/earnings' },
    { icon: MessageCircle, label: 'Messages', path: '/dashboard/freelancer/messages' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/freelancer/notifications' },
    { icon: Settings, label: 'Settings', path: '/dashboard/freelancer/settings' },
  ];

  const menuItems = userType === 'client' ? clientMenuItems : freelancerMenuItems;
  const switchPath = userType === 'client' ? '/dashboard/freelancer' : '/dashboard/client';
  const switchLabel = userType === 'client' ? 'Switch to Freelancer' : 'Switch to Client';
  const canSwitchRole = user?.role === 'BOTH';

  return (
    <div className="w-60 h-screen fixed left-0 top-0 bg-[#141414] border-r border-[#2A2A2A] flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-[#F5C800]" />
          <span className="text-xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#F5C800] font-bold">
            {userName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white">{userName}</div>
            <div className="text-xs px-2 py-1 bg-[#F5C800] text-black rounded-full inline-block">
              {userType === 'client' ? 'Client' : 'Freelancer'}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive
                  ? 'bg-[#F5C800] text-black font-bold'
                  : 'text-[#888888] hover:border-l-4 hover:border-[#F5C800] hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#2A2A2A]">
        {canSwitchRole && (
          <Link
            to={switchPath}
            className="block text-[#888888] hover:text-[#F5C800] mb-3 text-sm transition-colors"
          >
            {switchLabel}
          </Link>
        )}
        <Link
          to="/login"
          onClick={logout}
          className="flex items-center gap-2 text-[#EF4444] hover:text-[#FF6B6B] text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Link>
      </div>
    </div>
  );
}
