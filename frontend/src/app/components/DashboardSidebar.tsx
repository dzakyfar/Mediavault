import { Link, useLocation, useNavigate } from 'react-router';
import { Zap, Home, Briefcase, Search, MessageCircle, Bell, CreditCard, Settings, LogOut, FileText, Folder, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UserAvatar from './UserAvatar';

interface DashboardSidebarProps {
  userType: 'client' | 'freelancer';
  userName: string;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export default function DashboardSidebar({ userType, userName, unreadMessages = 0, unreadNotifications = 0 }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const clientMenuItems = [
    { icon: Home, label: t('Ringkasan', 'Overview'), path: '/dashboard/client' },
    { icon: Briefcase, label: t('Proyek Saya', 'My Projects'), path: '/dashboard/client/projects' },
    { icon: Search, label: t('Cari Freelancer', 'Find Freelancers'), path: '/dashboard/client/find-freelancer' },
    { icon: MessageCircle, label: t('Pesan', 'Messages'), path: '/dashboard/client/messages', badge: unreadMessages },
    { icon: Bell, label: t('Notifikasi', 'Notifications'), path: '/dashboard/client/notifications', badge: unreadNotifications },
    { icon: CreditCard, label: t('Pembayaran', 'Payments'), path: '/dashboard/client/payments' },
    { icon: Settings, label: t('Pengaturan', 'Settings'), path: '/dashboard/client/settings' },
  ];

  const freelancerMenuItems = [
    { icon: Home, label: t('Ringkasan', 'Overview'), path: '/dashboard/freelancer' },
    { icon: FileText, label: t('Permintaan Pekerjaan', 'Job Requests'), path: '/dashboard/freelancer/requests' },
    { icon: Briefcase, label: t('Proyek Saya', 'My Projects'), path: '/dashboard/freelancer/projects' },
    { icon: Folder, label: t('Portofolio', 'Portfolio'), path: '/dashboard/freelancer/portfolio' },
    { icon: DollarSign, label: t('Pendapatan', 'Earnings'), path: '/dashboard/freelancer/earnings' },
    { icon: MessageCircle, label: t('Pesan', 'Messages'), path: '/dashboard/freelancer/messages', badge: unreadMessages },
    { icon: Bell, label: t('Notifikasi', 'Notifications'), path: '/dashboard/freelancer/notifications', badge: unreadNotifications },
    { icon: Settings, label: t('Pengaturan', 'Settings'), path: '/dashboard/freelancer/settings' },
  ];

  const menuItems = userType === 'client' ? clientMenuItems : freelancerMenuItems;
  const switchLabel = userType === 'client' ? t('Beralih ke Freelancer', 'Switch to Freelancer') : t('Beralih ke Klien', 'Switch to Client');
  const isRegisteredFreelancer = Boolean(
    user?.role && ['BOTH', 'FREELANCER'].includes(user.role) && user.isAvailable && user.bio && user.specialty
  );
  const showSwitchRole = userType === 'client' || user?.role === 'BOTH' || user?.role === 'FREELANCER';

  const handleSwitchRole = () => {
    if (userType === 'client') {
      navigate(isRegisteredFreelancer ? '/dashboard/freelancer' : '/freelancer-onboarding');
      return;
    }

    navigate('/dashboard/client');
  };

  return (
    <aside className="sticky top-0 h-screen w-60 shrink-0 bg-[#141414] border-r border-[#2A2A2A] flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-[#F5C800]" />
          <span className="text-xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <UserAvatar name={userName} src={user?.avatarUrl} className="h-12 w-12 text-lg" />
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
                  : item.badge
                    ? 'text-white border-l-4 border-[#F5C800] bg-[#F5C800]/5'
                    : 'text-[#888888] hover:border-l-4 hover:border-[#F5C800] hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {Boolean(item.badge) && (
                <span className={`min-w-6 h-6 px-2 rounded-full text-xs font-bold inline-flex items-center justify-center ${
                  isActive ? 'bg-black text-[#F5C800]' : 'bg-[#F5C800] text-black'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#2A2A2A]">
        {showSwitchRole && (
          <button
            type="button"
            onClick={handleSwitchRole}
            className="block text-[#888888] hover:text-[#F5C800] mb-3 text-sm transition-colors"
          >
            {switchLabel}
          </button>
        )}
        <Link
          to="/login"
          onClick={logout}
          className="flex items-center gap-2 text-[#EF4444] hover:text-[#FF6B6B] text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('Keluar', 'Log Out')}
        </Link>
      </div>
    </aside>
  );
}
