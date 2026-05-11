import { useState } from 'react';
import { Search, Send, Paperclip } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function FreelancerMessages() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [message, setMessage] = useState('');

  const conversations = [
    { id: 1, name: 'Rania K.', preview: 'Looks perfect! Can you also add...', time: '2h ago', unread: 0, online: true },
    { id: 2, name: 'Budi S.', preview: 'When can we schedule the shoot?', time: '5h ago', unread: 1, online: false },
    { id: 3, name: 'Sarah M.', preview: 'Thank you for the amazing work!', time: '1d ago', unread: 0, online: false },
  ];

  const messages = [
    { sender: 'Rania K.', text: 'Hi Fauzan! How is the project coming along?', time: '10:00 AM', isFreelancer: false },
    { sender: 'You', text: 'Hi! I have uploaded the first batch of photos', time: '10:30 AM', isFreelancer: true },
    { sender: 'Rania K.', text: 'Great! Let me check them out', time: '10:32 AM', isFreelancer: false },
    { sender: 'You', text: 'Let me know if you need any revisions', time: '10:33 AM', isFreelancer: true },
    { sender: 'Rania K.', text: 'Looks perfect! Can you also add a few more product angles?', time: '10:35 AM', isFreelancer: false },
  ];

  return (
    <DashboardLayout userType="freelancer" userName="Fauzan A.">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Messages
      </h1>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, i) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(i)}
                className={`w-full p-4 border-b border-[#2A2A2A] text-left transition-all ${
                  selectedConversation === i
                    ? 'bg-[#1A1A1A] border-l-4 border-l-[#F5C800]'
                    : 'hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#141414] flex items-center justify-center text-[#F5C800] font-bold">
                      {conv.name.charAt(0)}
                    </div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] border-2 border-[#1A1A1A] rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{conv.name}</span>
                      <span className="text-xs text-[#888888]">{conv.time}</span>
                    </div>
                    <p className="text-sm text-[#888888] truncate">{conv.preview}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="flex-shrink-0 w-5 h-5 bg-[#F5C800] text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unread}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] flex flex-col">
          <div className="p-4 border-b border-[#2A2A2A] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center text-[#F5C800] font-bold">
              {conversations[selectedConversation].name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-white">{conversations[selectedConversation].name}</div>
              <div className="flex items-center gap-1 text-sm">
                {conversations[selectedConversation].online && (
                  <>
                    <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                    <span className="text-[#888888]">Online</span>
                  </>
                )}
                {!conversations[selectedConversation].online && (
                  <span className="text-[#888888]">Offline</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isFreelancer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md ${msg.isFreelancer ? 'bg-[#F5C800] text-black' : 'bg-[#141414] text-white border border-[#2A2A2A]'} rounded-lg p-4`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-2 ${msg.isFreelancer ? 'text-black/70' : 'text-[#888888]'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-[#141414] transition-colors">
                <Paperclip className="w-5 h-5 text-[#888888]" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none transition-all"
              />
              <button className="p-3 bg-[#F5C800] rounded-lg hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all">
                <Send className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
