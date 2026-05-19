import { FormEvent, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import EmptyState from '../EmptyState';
import { apiRequest } from '../../lib/api';

interface Message {
  id: string;
  body: string;
  createdAt: string;
  read: boolean;
  isMine: boolean;
  senderId: string;
  receiverId: string;
  sender: string;
  receiver: string;
  peerId: string;
  peerName: string;
}

interface Conversation {
  peerId: string;
  peerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface MessagesResponse {
  messages: Message[];
  conversations: Conversation[];
}

export default function MessageCenter({ userType }: { userType: 'client' | 'freelancer' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePeerId, setActivePeerId] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiRequest<MessagesResponse>('/messages');
      setMessages(response.messages);
      setConversations(response.conversations);
      setActivePeerId((current) => current || response.conversations[0]?.peerId || '');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pesan');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = window.setInterval(() => loadMessages(true), 4000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activePeerId) return;
    apiRequest('/messages/read', {
      method: 'PATCH',
      body: JSON.stringify({ peerId: activePeerId }),
    }).then(() => loadMessages(true)).catch(() => undefined);
  }, [activePeerId]);

  const activeMessages = useMemo(
    () => messages.filter((message) => message.peerId === activePeerId),
    [activePeerId, messages]
  );
  const activeConversation = conversations.find((conversation) => conversation.peerId === activePeerId);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!activePeerId || !draft.trim()) return;

    try {
      setSending(true);
      await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId: activePeerId, body: draft }),
      });
      setDraft('');
      await loadMessages(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Messages
        </h1>
        <button
          type="button"
          onClick={() => loadMessages(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      {loading && <EmptyState title="Memuat pesan" description="Mengambil percakapan terbaru dari database." />}

      {!loading && conversations.length === 0 && (
        <EmptyState
          title="Belum ada pesan"
          description={userType === 'client'
            ? 'Percakapan dari request job dan pemesanan jasa akan tampil di sini.'
            : 'Pesan dari request job dan pemesanan jasa akan tampil di sini.'}
        />
      )}

      {conversations.length > 0 && (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6 min-h-[560px]">
          <aside className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {conversations.map((conversation) => (
              <button
                key={conversation.peerId}
                type="button"
                onClick={() => setActivePeerId(conversation.peerId)}
                className={`w-full text-left p-4 border-b border-[#2A2A2A] transition-colors ${
                  activePeerId === conversation.peerId ? 'bg-[#F5C800] text-black' : 'text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{conversation.peerName}</span>
                  {conversation.unreadCount > 0 && (
                    <span className="min-w-6 h-6 px-2 rounded-full bg-[#EF4444] text-white text-xs font-bold inline-flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 truncate ${activePeerId === conversation.peerId ? 'text-black/70' : 'text-[#888888]'}`}>
                  {conversation.lastMessage}
                </p>
              </button>
            ))}
          </aside>

          <section className="bg-[#141414] border border-[#2A2A2A] rounded-xl flex flex-col min-h-[560px]">
            <div className="p-5 border-b border-[#2A2A2A]">
              <h2 className="text-xl font-bold text-white">{activeConversation?.peerName || 'Conversation'}</h2>
              <p className="text-sm text-[#888888]">Auto-refresh setiap beberapa detik.</p>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto">
              {activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-3xl rounded-xl p-4 border ${
                    message.isMine
                      ? 'ml-auto bg-[#F5C800] text-black border-[#F5C800]'
                      : 'bg-[#1A1A1A] text-white border-[#2A2A2A]'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {message.isMine ? `To ${message.receiver}` : `From ${message.sender}`}
                  </div>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="p-5 border-t border-[#2A2A2A] flex gap-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Tulis balasan..."
                className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
