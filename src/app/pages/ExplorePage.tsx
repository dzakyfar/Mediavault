import { Link } from 'react-router';
import { Camera, Star, Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ExplorePage() {
  const freelancers = [
    { id: '1', name: 'Fauzan A.', specialty: 'Wedding | Portrait', rating: '4.9', price: 'Rp 500K', city: 'Surabaya', available: true },
    { id: '2', name: 'Nathanael V.', specialty: 'Product | Commercial', rating: '4.8', price: 'Rp 750K', city: 'Jakarta', available: true },
    { id: '3', name: 'Dzaky F.', specialty: 'Fashion | Editorial', rating: '5.0', price: 'Rp 1M', city: 'Bandung', available: false },
    { id: '4', name: 'Rania K.', specialty: 'Corporate | Events', rating: '4.9', price: 'Rp 600K', city: 'Yogyakarta', available: true },
    { id: '5', name: 'Ahmad S.', specialty: 'Concert | Live Events', rating: '4.7', price: 'Rp 800K', city: 'Surabaya', available: false },
    { id: '6', name: 'Siti M.', specialty: 'Real Estate', rating: '4.8', price: 'Rp 550K', city: 'Jakarta', available: true },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-6xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Find Your Shooter
        </h1>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 mb-12">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                <input
                  type="text"
                  placeholder="Search by name, skill, city..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                />
              </div>
            </div>
            <select className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all">
              <option>All Categories</option>
              <option>Wedding</option>
              <option>Product</option>
              <option>Fashion</option>
              <option>Corporate</option>
              <option>Concert</option>
              <option>Real Estate</option>
            </select>
            <button className="flex items-center justify-center gap-2 bg-[#F5C800] text-black font-bold rounded-lg px-4 py-3 hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#F5C800]" />
              <span className="text-sm text-[#888888]">Available Only</span>
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className="bg-[#141414] rounded-xl p-6 border border-[#2A2A2A] hover:border-[#F5C800] hover:-translate-y-1 transition-all">
              <div className="relative w-full aspect-square bg-[#1A1A1A] rounded-lg mb-4 flex items-center justify-center">
                <Camera className="w-12 h-12 text-[#888888]" />
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {freelancer.available ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-[#22C55E] text-white rounded-full text-xs font-bold">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Available
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-[#888888] text-white rounded-full text-xs font-bold">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Busy
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-bold mb-2 text-white">{freelancer.name}</h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                {freelancer.specialty.split(' | ').map((tag, j) => (
                  <span key={j} className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 mb-2 text-sm">
                <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                <span>{freelancer.rating}</span>
                <span className="text-[#888888] ml-2">• {freelancer.city}</span>
              </div>
              <p className="text-[#F5C800] font-bold mb-4">From {freelancer.price}</p>
              <Link
                to={`/freelancer/${freelancer.id}`}
                className="block w-full px-4 py-2 border border-[#888888] rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors text-center"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-[#F5C800] text-black font-bold rounded-lg">1</button>
            <button className="px-4 py-2 bg-[#141414] text-white border border-[#2A2A2A] rounded-lg hover:border-[#F5C800] transition-colors">2</button>
            <button className="px-4 py-2 bg-[#141414] text-white border border-[#2A2A2A] rounded-lg hover:border-[#F5C800] transition-colors">3</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
