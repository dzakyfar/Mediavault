import { ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import DashboardSidebar from './DashboardSidebar';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { language, t } = useLanguage();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const displayName = user?.fullName || userName || 'User';
  const firstName = displayName.split(' ')[0];
  const hour = new Date().getHours();
  const timeGreeting = hour < 11
    ? t('Selamat pagi', 'Good morning')
    : hour < 15
      ? t('Selamat siang', 'Good afternoon')
      : hour < 19
        ? t('Selamat sore', 'Good evening')
        : t('Selamat malam', 'Good night');
  const currentDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
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

    const loadUnreadCounters = async () => {
      try {
        const [notificationResponse, messageResponse] = await Promise.all([
          apiRequest<{ unreadCount: number }>('/notifications'),
          apiRequest<{ unreadCount: number }>('/messages/unread-count'),
        ]);
        if (mounted) {
          setUnreadNotifications(notificationResponse.unreadCount || 0);
          setUnreadMessages(messageResponse.unreadCount || 0);
        }
      } catch {
        if (mounted) {
          setUnreadNotifications(0);
          setUnreadMessages(0);
        }
      }
    };

    loadUnreadCounters();
    const interval = window.setInterval(loadUnreadCounters, 8000);
    window.addEventListener('mediavault:notifications-refresh', loadUnreadCounters);
    window.addEventListener('mediavault:messages-refresh', loadUnreadCounters);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('mediavault:notifications-refresh', loadUnreadCounters);
      window.removeEventListener('mediavault:messages-refresh', loadUnreadCounters);
    };
  }, []);

  return (
    <div className="mv-no-page-transform flex min-h-screen bg-[#0A0A0A] mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <DashboardSidebar
        userType={userType}
        userName={displayName}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
      />

      <div className="min-w-0 flex-1">
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
                {theme === 'dark' ? t('Terang', 'Light') : t('Gelap', 'Dark')}
              </button>
              <Link
                to={notificationPath}
                className="relative p-2 rounded-lg hover:bg-[#141414] transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-[#0A0A0A]">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
              <Link to={settingsPath}>
                <UserAvatar name={displayName} src={user?.avatarUrl} className="h-10 w-10 hover:ring-[#F5C800] transition-colors cursor-pointer" />
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
