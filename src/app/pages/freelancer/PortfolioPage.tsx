import { Link } from 'react-router';
import { Plus, Camera, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function FreelancerPortfolio() {
  const portfolioItems = [
    { id: 1, title: 'Fashion Editorial 2026', category: 'Fashion', image: null },
    { id: 2, title: 'Product Photography - Cosmetics', category: 'Product', image: null },
    { id: 3, title: 'Corporate Headshots', category: 'Corporate', image: null },
    { id: 4, title: 'Wedding - Sarah & Michael', category: 'Wedding', image: null },
    { id: 5, title: 'Street Fashion Lookbook', category: 'Fashion', image: null },
    { id: 6, title: 'Food Photography', category: 'Product', image: null },
  ];

  return (
    <DashboardLayout userType="freelancer" userName="Fauzan A.">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          My Portfolio
        </h1>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
          <Plus className="w-5 h-5" />
          Add Work
        </button>
      </div>

      <div className="mb-8 p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Your Public Profile</h3>
            <p className="text-[#888888]">This is how clients will see your work</p>
          </div>
          <Link
            to="/freelancer/1"
            className="px-6 py-3 border border-[#888888] rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
          >
            View Public Profile
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {portfolioItems.map((item) => (
          <div key={item.id} className="group relative bg-[#141414] rounded-xl overflow-hidden border border-[#2A2A2A] hover:border-[#F5C800] transition-all">
            <div className="aspect-square bg-[#1A1A1A] flex items-center justify-center">
              <Camera className="w-16 h-16 text-[#888888]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex gap-2 mb-3">
                  <button className="flex items-center gap-2 flex-1 px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_10px_rgba(245,200,0,0.4)] transition-all">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg hover:bg-[#EF4444] hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <span className="inline-block px-3 py-1 bg-[#F5C800] text-black rounded-full text-xs font-bold">
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-center">
        <Camera className="w-16 h-16 text-[#888888] mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Add Your Best Work</h3>
        <p className="text-[#888888] mb-6">
          Upload your portfolio pieces to attract more clients
        </p>
        <button className="px-8 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
          Upload New Work
        </button>
      </div>
    </DashboardLayout>
  );
}
