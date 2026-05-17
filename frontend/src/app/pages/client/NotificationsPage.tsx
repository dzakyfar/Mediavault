import DashboardLayout from '../../components/DashboardLayout';
import { FileText, MessageCircle, CreditCard, CheckCircle } from 'lucide-react';

export default function ClientNotifications() {
  const notifications = [
    { icon: FileText, text: 'Fauzan uploaded 3 new files to Brand Product Shoot', time: '2 hours ago', unread: true, color: 'text-[#F5C800]' },
    { icon: MessageCircle, text: 'New message from Nathanael V.', time: '3 hours ago', unread: true, color: 'text-[#3B82F6]' },
    { icon: CreditCard, text: 'Payment Rp 500K confirmed', time: 'Yesterday', unread: false, color: 'text-[#22C55E]' },
    { icon: CheckCircle, text: 'Project "Corporate Headshots" marked complete', time: '3 days ago', unread: false, color: 'text-[#888888]' },
    { icon: FileText, text: 'New invoice #INV-2026-003 generated', time: '4 days ago', unread: false, color: 'text-[#888888]' },
  ];

  return (
    <DashboardLayout userType="client" userName="Rania K.">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Notifications
        </h1>
        <button className="px-4 py-2 border border-[#888888] rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors">
          Mark All Read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
              notif.unread
                ? 'bg-[#1A1A1A] border-l-4 border-l-[#F5C800]'
                : 'bg-[#141414] border border-[#2A2A2A]'
            }`}
          >
            <div className="flex-shrink-0">
              {notif.unread && <div className="w-2 h-2 bg-[#F5C800] rounded-full mb-2"></div>}
              <notif.icon className={`w-6 h-6 ${notif.color}`} />
            </div>
            <div className="flex-1">
              <p className={notif.unread ? 'text-white font-medium' : 'text-[#888888]'}>
                {notif.text}
              </p>
              <p className="text-sm text-[#888888] mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
