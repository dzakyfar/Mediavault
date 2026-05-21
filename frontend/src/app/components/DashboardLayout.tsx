import { ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../lib/api';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'client' | 'freelancer';
  userName?: string;
  greeting?: string;
}

export default function DashboardLayout({ children, userType, userName, greeting }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const displayName = user?.fullName || userName || 'User';
  const firstName = displayName.split(' ')[0];
  const hour = new Date().getHours();
  const timeGreeting = hour < 11
    ? 'Good morning'
    : hour < 15
      ? 'Good afternoon'
      : hour < 19
        ? 'Good evening'
        : 'Good night';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const notificationPath = userType === 'client'
    ? '/dashboard/client/notifications'
    : '/dashboard/freelancer/notifications';

  const settingsPath = userType === 'client'
    ? '/dashboard/client/settings'
    : '/dashboard/freelancer/settings';

  useEffect(() => {
    let mounted = true;

    const loadUnreadNotifications = async () => {
      try {
        const response = await apiRequest<{ unreadCount: number }>('/notifications');
        if (mounted) setUnreadNotifications(response.unreadCount || 0);
      } catch {
        if (mounted) setUnreadNotifications(0);
      }
    };

    loadUnreadNotifications();
    const interval = window.setInterval(loadUnreadNotifications, 8000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <DashboardSidebar userType={userType} userName={displayName} />

      <div className="ml-60">
        <div className="border-b border-[#2A2A2A] bg-[#0A0A0A] sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl text-white font-bold">
                {greeting || `${timeGreeting}, ${firstName}`}!
              </h1>
              <p className="text-sm text-[#888888]">{currentDate}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-2 rounded-lg hover:bg-[#141414] transition-colors text-[#F5C800] text-sm font-bold"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <Link
                to={notificationPath}
                className="relative p-2 rounded-lg hover:bg-[#141414] transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#F5C800] rounded-full" />
                )}
              </Link>
              <Link to={settingsPath}>
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] overflow-hidden flex items-center justify-center text-[#F5C800] font-bold hover:bg-[#2A2A2A] transition-colors cursor-pointer">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    : displayName.charAt(0)}
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
