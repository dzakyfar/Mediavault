import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Camera, Download, MessageCircle, Star } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function ClientProjectDetail() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = ['overview', 'files', 'timeline', 'payment'];

  return (
    <DashboardLayout userType="client" userName="Rania K.">
      <div className="mb-6">
        <Link to="/dashboard/client/projects" className="flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Dashboard → My Projects → Brand Product Shoot</span>
        </Link>
      </div>

      <div className="bg-[#141414] rounded-xl p-8 mb-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-4xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Brand Product Shoot — Maret 2026
            </h1>
            <span className="inline-block px-4 py-2 bg-[#F5C800] text-black font-bold rounded-full mb-4">
              IN PROGRESS
            </span>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#888888]">Progress</span>
                <span className="text-[#F5C800] font-bold">60% Complete</span>
              </div>
              <div className="w-full h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-[#F5C800] rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#888888]">
                <span>📅</span>
                <span>Deadline: 10 Mar 2026</span>
              </div>
              <div className="flex items-center gap-2 text-[#888888]">
                <span>📍</span>
                <span>Surabaya</span>
              </div>
              <div className="flex items-center gap-2 text-[#888888]">
                <span>💳</span>
                <span>Rp 1.500.000</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-[#F5C800]" />
            </div>
            <h3 className="text-xl font-bold mb-1">Fauzan Ardiansyah</h3>
            <p className="text-[#888888] mb-2">Product & Commercial</p>
            <div className="flex items-center gap-1 mb-4">
              <Star className="w-4 h-4 text-[#F5C800] fill-current" />
              <span>4.9 (47 reviews)</span>
            </div>
            <Link
              to="/dashboard/client/messages"
              className="flex items-center gap-2 px-6 py-2 border border-[#888888] rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message Freelancer
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#2A2A2A]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold capitalize transition-all ${
              activeTab === tab
                ? 'text-[#F5C800] border-b-2 border-[#F5C800]'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Project Brief</h3>
            <p className="text-[#888888]">
              Foto produk untuk campaign Ramadhan brand kosmetik lokal. Output 30 foto edited high-res.
            </p>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Scope & Deliverables</h3>
            <div className="space-y-3">
              {[
                { label: 'Pre-production meeting', done: true },
                { label: 'Location scouting', done: true },
                { label: 'Main shoot day', done: false, inProgress: true },
                { label: 'Photo editing', done: false },
                { label: 'Final delivery', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    item.done ? 'bg-[#22C55E]' : item.inProgress ? 'bg-[#F5C800]' : 'bg-[#2A2A2A]'
                  }`}>
                    {item.done && <span className="text-black text-sm">✓</span>}
                  </div>
                  <span className={item.done ? 'text-white' : 'text-[#888888]'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Uploaded Files</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all">
              <Download className="w-4 h-4" />
              Download All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#141414] rounded-lg p-4 border border-[#2A2A2A] hover:border-[#F5C800] transition-all">
                <div className="w-full aspect-square bg-[#1A1A1A] rounded-lg mb-3"></div>
                <p className="text-sm font-bold mb-1">product_shot_{i}.jpg</p>
                <p className="text-xs text-[#888888]">2.4 MB</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h3 className="text-xl font-bold mb-6">Project Timeline</h3>
          <div className="space-y-4">
            {[
              { event: 'Fauzan uploaded 3 files', time: '2 hours ago', color: '#F5C800' },
              { event: 'Main shoot day completed', time: 'Yesterday', color: '#22C55E' },
              { event: 'Location scouting completed', time: '3 days ago', color: '#888888' },
              { event: 'Project started', time: '1 week ago', color: '#888888' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  {i < 3 && <div className="w-0.5 h-12 bg-[#2A2A2A] my-1"></div>}
                </div>
                <div className="flex-1">
                  <p className="text-white">{item.event}</p>
                  <p className="text-xs text-[#888888]">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h3 className="text-xl font-bold mb-6">Payment Summary</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-[#888888]">Service Fee</span>
              <span>Rp 1.500.000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888888]">Platform Fee (5%)</span>
              <span>Rp 75.000</span>
            </div>
            <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="text-[#F5C800] font-bold">Rp 1.575.000</span>
            </div>
          </div>
          <Link
            to="/dashboard/client/payments"
            className="block w-full px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg text-center hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
          >
            View Payment Details
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
