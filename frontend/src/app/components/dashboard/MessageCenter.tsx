import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ImagePlus, RefreshCw, Send, X } from 'lucide-react';
import EmptyState from '../EmptyState';
import { apiRequest } from '../../lib/api';
import { MESSAGE_IMAGE_MAX_BYTES, readFileAsDataUrl, validateImageFile } from '../../lib/uploadLimits';

interface Message {
  id: string;
  body: string;
  imageUrl?: string | null;
  imageName?: string | null;
  imageMime?: string | null;
  imageSize?: number | null;
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
  const [searchParams] = useSearchParams();
  const requestedPeerId = searchParams.get('peerId') || '';
  const requestedPeerName = searchParams.get('peerName') || 'Conversation';
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePeerId, setActivePeerId] = useState('');
  const [draft, setDraft] = useState('');
  const [imageDraft, setImageDraft] = useState<{
    url: string;
    name: string;
    mime: string;
    size: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiRequest<MessagesResponse>('/messages');
      const nextMessages = Array.isArray(response.messages) ? response.messages : [];
      const backendConversations = Array.isArray(response.conversations) ? response.conversations : [];
      const nextConversations = requestedPeerId && !backendConversations.some((conversation) => conversation.peerId === requestedPeerId)
        ? [
          {
            peerId: requestedPeerId,
            peerName: requestedPeerName,
            lastMessage: 'Mulai percakapan',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
          },
          ...backendConversations,
        ]
        : backendConversations;
      setMessages(nextMessages);
      setConversations(nextConversations);
      setActivePeerId((current) => {
        if (requestedPeerId && nextConversations.some((conversation) => conversation.peerId === requestedPeerId)) {
          return requestedPeerId;
        }

        if (current && nextConversations.some((conversation) => conversation.peerId === current)) {
          return current;
        }

        return nextConversations[0]?.peerId || '';
      });
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
  }, [requestedPeerId, requestedPeerName]);

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
    if (!activePeerId || (!draft.trim() && !imageDraft)) return;

    try {
      setSending(true);
      await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: activePeerId,
          body: draft,
          imageUrl: imageDraft?.url,
          imageName: imageDraft?.name,
          imageMime: imageDraft?.mime,
          imageSize: imageDraft?.size,
        }),
      });
      setDraft('');
      setImageDraft(null);
      await loadMessages(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const attachImage = async (file?: File) => {
    if (!file) return;
    const validationError = validateImageFile(file, MESSAGE_IMAGE_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const url = await readFileAsDataUrl(file);
      setImageDraft({
        url,
        name: file.name,
        mime: file.type,
        size: file.size,
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca gambar');
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
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt={message.imageName || 'Message attachment'}
                      className="mb-3 max-h-72 rounded-lg object-contain bg-black/10"
                    />
                  )}
                  <p>{message.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="p-5 border-t border-[#2A2A2A] space-y-3">
              {imageDraft && (
                <div className="flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
                  <img src={imageDraft.url} alt={imageDraft.name} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-bold text-white">{imageDraft.name}</div>
                    <div className="text-sm text-[#888888]">PNG/JPEG, maksimal 1MB</div>
                  </div>
                  <button type="button" onClick={() => setImageDraft(null)} className="text-[#888888] hover:text-[#EF4444]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <label className="inline-flex items-center justify-center w-12 rounded-lg border border-[#888888] text-white hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
                  <ImagePlus className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(event) => attachImage(event.target.files?.[0])}
                  />
                </label>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Tulis balasan..."
                  className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || (!draft.trim() && !imageDraft)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
