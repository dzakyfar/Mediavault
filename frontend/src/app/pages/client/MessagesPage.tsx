import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

interface Message {
  id: string;
  body: string;
  isMine: boolean;
  sender: string;
  receiver: string;
}

export default function ClientMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ messages: Message[] }>('/messages')
      .then((response) => setMessages(response.messages))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout userType="client">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Messages
      </h1>
      {loading && <EmptyState title="Memuat pesan" description="Mengambil pesan dari database." />}
      {!loading && messages.length === 0 && (
        <EmptyState title="Belum ada pesan" description="Percakapan dari job request dan pemesanan jasa akan tampil di sini." />
      )}
      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`max-w-3xl rounded-xl p-4 border ${message.isMine ? 'ml-auto bg-[#F5C800] text-black border-[#F5C800]' : 'bg-[#1A1A1A] text-white border-[#2A2A2A]'}`}>
            <div className="text-xs opacity-70 mb-1">{message.isMine ? `To ${message.receiver}` : `From ${message.sender}`}</div>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
