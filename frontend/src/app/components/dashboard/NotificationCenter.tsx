import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, CreditCard, FolderKanban, MessageCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import EmptyState from '../EmptyState';
import { apiRequest } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

type NotificationType = 'INFO' | 'PROJECT' | 'PAYMENT' | 'MESSAGE';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  synthetic?: boolean;
}

interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

const iconByType = {
  INFO: Bell,
  PROJECT: FolderKanban,
  PAYMENT: CreditCard,
  MESSAGE: MessageCircle,
};

export default function NotificationCenter({ userType }: { userType: 'client' | 'freelancer' }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiRequest<NotificationResponse>('/notifications');
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal memuat notifikasi', 'Failed to load notifications'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(() => loadNotifications(true), 6000);
    return () => window.clearInterval(interval);
  }, []);

  const filterOptions = [
    { id: 'all', label: t('Semua', 'All') },
    { id: 'PROJECT', label: t('Proyek', 'Projects') },
    { id: 'MESSAGE', label: t('Pesan', 'Messages') },
    { id: 'PAYMENT', label: t('Pembayaran', 'Payments') },
  ];

  const filteredNotifications = useMemo(() => (
    activeFilter === 'all'
      ? notifications
      : notifications.filter((notification) => notification.type === activeFilter)
  ), [activeFilter, notifications]);

  const markAllRead = async () => {
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
    await loadNotifications(true);
    window.dispatchEvent(new Event('mediavault:notifications-refresh'));
  };

  const markOneRead = async (notification: NotificationItem) => {
    if (notification.read || notification.synthetic) return;
    await apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH' });
    await loadNotifications(true);
    window.dispatchEvent(new Event('mediavault:notifications-refresh'));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Notifikasi', 'Notifications')}
          </h1>
          <p className="text-sm text-[#888888]">
            {unreadCount > 0
              ? t(`${unreadCount} update belum dibaca`, `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`)
              : t('Semua update sudah terbaca', 'All updates have been read')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadNotifications(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('Muat Ulang', 'Refresh')}
          </button>
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg"
          >
            <CheckCheck className="w-4 h-4" />
            {t('Tandai Semua Dibaca', 'Mark All As Read')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(option.id)}
            className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${
              activeFilter === option.id ? 'bg-[#F5C800] text-black' : 'bg-[#141414] text-[#888888] hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      {loading && <EmptyState title={t('Memuat notifikasi', 'Loading notifications')} description={t('Menyiapkan update penting untuk Anda.', 'Preparing your important updates.')} />}
      {!loading && filteredNotifications.length === 0 && (
        <EmptyState
          title={t('Belum ada notifikasi', 'No notifications yet')}
          description={userType === 'client'
            ? t('Update request freelancer, status project, pembayaran, dan pesan penting akan tampil di sini.', 'Freelancer requests, project status, payment updates, and important messages will appear here.')
            : t('Update offer client, status project, pembayaran, dan pesan penting akan tampil di sini.', 'Client offers, project status, payment updates, and important messages will appear here.')}
        />
      )}

      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const Icon = iconByType[notification.type] || Bell;
          const content = (
            <div
              className={`w-full bg-[#1A1A1A] border rounded-xl p-5 text-left transition-colors ${
                notification.read ? 'border-[#2A2A2A]' : 'border-[#F5C800]'
              }`}
              onClick={() => markOneRead(notification)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#141414] flex items-center justify-center text-[#F5C800]">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-white">{notification.title}</h3>
                    {!notification.read && <span className="w-2.5 h-2.5 rounded-full bg-[#F5C800]" />}
                  </div>
                  {notification.body && <p className="text-[#888888] mt-1">{notification.body}</p>}
                </div>
              </div>
            </div>
          );

          return notification.actionUrl ? (
            <Link key={notification.id} to={notification.actionUrl}>{content}</Link>
          ) : (
            <div key={notification.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
