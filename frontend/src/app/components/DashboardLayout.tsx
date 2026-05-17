import { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'client' | 'freelancer';
  userName: string;
  greeting?: string;
}

export default function DashboardLayout({ children, userType, userName, greeting }: DashboardLayoutProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const notificationPath = userType === 'client'
    ? '/dashboard/client/notifications'
    : '/dashboard/freelancer/notifications';

  const settingsPath = userType === 'client'
    ? '/dashboard/client/settings'
    : '/dashboard/freelancer/settings';

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <DashboardSidebar userType={userType} userName={userName} />

      <div className="ml-60">
        <div className="border-b border-[#2A2A2A] bg-[#0A0A0A] sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl text-white font-bold">
                {greeting || `Good morning, ${userName.split(' ')[0]}`} 👋
              </h1>
              <p className="text-sm text-[#888888]">{currentDate}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-[#141414] transition-colors text-white">
                ☀️
              </button>
              <Link
                to={notificationPath}
                className="relative p-2 rounded-lg hover:bg-[#141414] transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#F5C800] rounded-full"></span>
              </Link>
              <Link to={settingsPath}>
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#F5C800] font-bold hover:bg-[#2A2A2A] transition-colors cursor-pointer">
                  {userName.charAt(0)}
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
