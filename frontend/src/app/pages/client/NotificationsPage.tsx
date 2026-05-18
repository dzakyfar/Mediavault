import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

interface Notification {
  id: string;
  title: string;
  body: string | null;
}

export default function ClientNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ notifications: Notification[] }>('/notifications')
      .then((response) => setNotifications(response.notifications))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout userType="client">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Notifications
      </h1>
      {loading && <EmptyState title="Memuat notifikasi" description="Mengambil notifikasi dari database." />}
      {!loading && notifications.length === 0 && (
        <EmptyState title="Belum ada notifikasi" description="Request job freelancer dan update project akan muncul di sini." />
      )}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <h3 className="font-bold text-white">{notification.title}</h3>
            {notification.body && <p className="text-[#888888] mt-1">{notification.body}</p>}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
