import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Camera, Search, SlidersHorizontal, Star } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

interface Freelancer {
  id: string;
  name: string;
  avatarUrl?: string | null;
  specialty: string;
  rating: string | null;
  reviewCount: number;
  price: string;
  city: string;
  available: boolean;
}

export default function ClientFindFreelancer() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ freelancers: Freelancer[] }>('/freelancers')
      .then((response) => setFreelancers(response.freelancers))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat freelancer'))
      .finally(() => setLoading(false));
  }, []);

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const searchable = `${freelancer.name} ${freelancer.specialty} ${freelancer.city}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesCategory = !category || freelancer.specialty.toLowerCase().includes(category.toLowerCase());
    const matchesAvailability = !availableOnly || freelancer.available;
    return matchesQuery && matchesCategory && matchesAvailability;
  });

  return (
    <DashboardLayout userType="client">
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Find Freelancer
      </h1>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, skill, city..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
          >
            <option value="">All Categories</option>
            <option value="Wedding">Wedding</option>
            <option value="Product">Product</option>
            <option value="Fashion">Fashion</option>
            <option value="Corporate">Corporate</option>
            <option value="Concert">Concert</option>
            <option value="Real Estate">Real Estate</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('');
              setAvailableOnly(false);
            }}
            className="flex items-center justify-center gap-2 bg-[#F5C800] text-black font-bold rounded-lg px-4 py-3 hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Reset
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
              className="w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#F5C800]"
            />
            <span className="text-sm text-[#888888]">Available Only</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {loading && (
          <div className="md:col-span-3">
            <EmptyState title="Memuat freelancer" description="Mengambil profil freelancer dari database." />
          </div>
        )}

        {!loading && filteredFreelancers.length === 0 && (
          <div className="md:col-span-3">
            <EmptyState title="Belum ada freelancer" description="Profil freelancer yang sesuai filter akan tampil di sini." />
          </div>
        )}

        {filteredFreelancers.map((freelancer) => (
          <div key={freelancer.id} className="bg-[#141414] rounded-xl p-6 border border-[#2A2A2A] hover:border-[#F5C800] hover:-translate-y-1 transition-all">
            <div className="relative w-full aspect-square bg-[#1A1A1A] rounded-lg mb-4 flex items-center justify-center">
              {freelancer.avatarUrl
                ? <img src={freelancer.avatarUrl} alt={freelancer.name} className="w-full h-full object-cover rounded-lg" />
                : <Camera className="w-12 h-12 text-[#888888]" />}
              <div className="absolute top-3 right-3">
                <div className={`flex items-center gap-1 px-3 py-1 text-white rounded-full text-xs font-bold ${freelancer.available ? 'bg-[#22C55E]' : 'bg-[#888888]'}`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                  {freelancer.available ? 'Available' : 'Busy'}
                </div>
              </div>
            </div>
            <h3 className="font-bold mb-2 text-white">{freelancer.name}</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {freelancer.specialty.split(/[|,]/).map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 mb-2 text-sm">
              <Star className="w-4 h-4 text-[#F5C800] fill-current" />
              <span>{freelancer.rating ?? 'Baru'}</span>
              {freelancer.reviewCount > 0 && <span className="text-[#888888]">({freelancer.reviewCount})</span>}
              <span className="text-[#888888] ml-2">- {freelancer.city}</span>
            </div>
            <p className="text-[#F5C800] font-bold mb-4">From {freelancer.price}</p>
            <Link
              to={`/freelancer/${freelancer.id}`}
              className="block w-full px-4 py-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors text-center"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
