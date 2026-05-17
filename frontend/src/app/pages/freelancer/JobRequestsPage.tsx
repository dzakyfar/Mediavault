import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function FreelancerJobRequests() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Declined' },
  ];

  const requests = [
    { id: '1', title: 'Wedding Photography - Bali', client: 'Dewi & Ahmad', budget: 'Rp 3.500.000', category: 'Wedding', desc: 'Looking for a photographer for our wedding ceremony in Bali. Need full day coverage.', posted: '2 hours ago', deadline: '25 May 2026', city: 'Bali' },
    { id: '2', title: 'Product Catalog Shoot', client: 'PT. Maju Jaya', budget: 'Rp 1.200.000', category: 'Product', desc: 'Need high-quality product photos for our new cosmetic line. 30 products.', posted: '5 hours ago', deadline: '15 May 2026', city: 'Surabaya' },
    { id: '3', title: 'Corporate Event Documentation', client: 'Budi Santoso', budget: 'Rp 2.000.000', category: 'Corporate', desc: 'Company anniversary event. Need photos and short video clips.', posted: '1 day ago', deadline: '20 May 2026', city: 'Jakarta' },
  ];

  return (
    <DashboardLayout userType="freelancer" userName="Fauzan A.">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Job Requests
      </h1>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#F5C800] text-black'
                : 'bg-[#141414] text-[#888888] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-l-4 hover:border-l-[#F5C800] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{request.title}</h3>
                  <span className="px-3 py-1 bg-[#F5C800] text-black rounded-full text-xs font-bold">
                    {request.category}
                  </span>
                </div>
                <p className="text-sm text-[#888888] mb-3">by {request.client} • {request.city}</p>
                <p className="text-[#888888]">{request.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-[#2A2A2A]">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-[#888888]">Budget: </span>
                  <span className="text-[#F5C800] font-bold">{request.budget}</span>
                </div>
                <span className="text-[#888888]">📅 Deadline: {request.deadline}</span>
                <span className="text-[#888888]">Posted {request.posted}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-6 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all">
                  Accept Request
                </button>
                <button className="px-6 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg hover:bg-[#EF4444] hover:text-white transition-all">
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
