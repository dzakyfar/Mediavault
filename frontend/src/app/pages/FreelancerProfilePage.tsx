import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Camera, MapPin, MessageCircle, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

interface FreelancerProfile {
  id: string;
  name: string;
  fullName: string;
  avatarUrl?: string | null;
  specialty: string;
  services: string[];
  bio: string;
  rating: string | null;
  reviewCount: number;
  price: string;
  city: string;
  available: boolean;
  portfolioItems: Array<{
    id: string;
    title: string;
    category: string | null;
    serviceType: string | null;
    description: string | null;
    fileUrl: string | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState({
    serviceType: '',
    title: '',
    description: '',
    budget: '',
    eventDate: '',
    deadline: '',
    city: '',
    address: '',
  });
  const isOwnProfile = Boolean(user && freelancer && user.id === freelancer.id);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ freelancer: FreelancerProfile }>(`/freelancers/${id}`, { auth: false })
      .then((response) => {
        setFreelancer(response.freelancer);
        setOrderData((current) => ({
          ...current,
          serviceType: response.freelancer.services[0] || '',
          city: response.freelancer.city === '-' ? '' : response.freelancer.city,
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat profile freelancer'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitOrder = async () => {
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }

    if (freelancer && user.id === freelancer.id) {
      setError('Tidak bisa memesan jasa dari profile sendiri');
      return;
    }

    try {
      setError('');
      await apiRequest(`/freelancers/${id}/order`, {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      navigate('/dashboard/client/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memesan jasa');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link to="/explore" className="text-[#888888] hover:text-[#F5C800] transition-colors">
          Back to explore
        </Link>

        {loading && (
          <div className="mt-8">
            <EmptyState title="Memuat profile" description="Mengambil profile freelancer dari database." />
          </div>
        )}

        {error && !freelancer && (
          <div className="mt-8">
            <EmptyState title="Profile tidak ditemukan" description={error} />
          </div>
        )}

        {freelancer && (
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <div className="flex items-start gap-6">
                  <div className="w-28 h-28 rounded-full bg-[#141414] overflow-hidden flex items-center justify-center text-[#F5C800] text-4xl font-bold">
                    {freelancer.avatarUrl
                      ? <img src={freelancer.avatarUrl} alt={freelancer.fullName} className="w-full h-full object-cover" />
                      : freelancer.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-5xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{freelancer.fullName}</h1>
                        <p className="text-[#888888]">{freelancer.specialty}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${freelancer.available ? 'bg-[#22C55E] text-white' : 'bg-[#888888] text-white'}`}>
                        {freelancer.available ? 'Available' : 'Busy'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-[#888888]">
                      <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{freelancer.city}</span>
                      <span className="inline-flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                        {freelancer.rating ?? 'Baru'}
                        {freelancer.reviewCount > 0 && <span>({freelancer.reviewCount} ulasan)</span>}
                      </span>
                      <span className="text-[#F5C800] font-bold">Mulai dari {freelancer.price}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-5">
                      {freelancer.services.map((service) => (
                        <span key={service} className="px-3 py-1 bg-[#141414] rounded-full text-sm text-[#F5C800]">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>About</h2>
                <p className="text-[#888888] leading-relaxed">{freelancer.bio}</p>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Portfolio</h2>
                {freelancer.portfolioItems.length === 0 ? (
                  <EmptyState title="Portfolio kosong" description="Freelancer ini belum mengupload portfolio, tapi profile tetap bisa dihubungi." />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {freelancer.portfolioItems.map((item) => (
                      <div key={item.id} className="bg-[#141414] rounded-lg p-4">
                        <div className="aspect-video bg-[#1A1A1A] rounded-lg mb-3 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#888888]" />
                        </div>
                        <h3 className="font-bold">{item.title}</h3>
                        {item.category && <p className="text-sm text-[#888888]">{item.category}</p>}
                        {item.serviceType && <p className="text-sm text-[#F5C800]">{item.serviceType}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Reviews</h2>
                {freelancer.reviews.length === 0 ? (
                  <EmptyState title="Belum ada review" description="Rating dan ulasan client akan muncul setelah project selesai direview." />
                ) : (
                  <div className="space-y-4">
                    {freelancer.reviews.map((review) => (
                      <div key={review.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-[#F5C800] font-bold mb-2">
                          <Star className="w-4 h-4 fill-current" />
                          {review.rating}/5
                        </div>
                        <p className="text-white mb-2">"{review.comment}"</p>
                        <p className="text-xs text-[#888888]">
                          {new Date(review.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 sticky top-24">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Pesan Jasa</h2>
                {isOwnProfile && (
                  <div className="mb-4 p-3 bg-[#F5C800]/10 border border-[#F5C800] rounded-lg text-[#F5C800] text-sm">
                    Ini profile Anda sendiri. Client lain tetap bisa melihat dan memesan jasa Anda.
                  </div>
                )}
                <div className="space-y-4">
                  <select
                    value={orderData.serviceType}
                    onChange={(e) => setOrderData({ ...orderData, serviceType: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                  >
                    {freelancer.services.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                  <input
                    value={orderData.title}
                    onChange={(e) => setOrderData({ ...orderData, title: e.target.value })}
                    placeholder="Judul kebutuhan"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                  />
                  <textarea
                    value={orderData.description}
                    onChange={(e) => setOrderData({ ...orderData, description: e.target.value })}
                    placeholder="Detail singkat kebutuhan"
                    rows={4}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                  />
                  <input
                    type="number"
                    value={orderData.budget}
                    onChange={(e) => setOrderData({ ...orderData, budget: e.target.value })}
                    placeholder="Budget"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={orderData.eventDate}
                      onChange={(e) => setOrderData({ ...orderData, eventDate: e.target.value })}
                      className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                    />
                    <input
                      type="date"
                      value={orderData.deadline}
                      onChange={(e) => setOrderData({ ...orderData, deadline: e.target.value })}
                      className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                    />
                  </div>
                  <input
                    value={orderData.city}
                    onChange={(e) => setOrderData({ ...orderData, city: e.target.value })}
                    placeholder="Kota"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                  />
                  <textarea
                    value={orderData.address}
                    onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                    placeholder="Alamat lengkap"
                    rows={3}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                  />
                  <button
                    onClick={submitOrder}
                    disabled={isOwnProfile}
                    className="w-full bg-[#F5C800] text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOwnProfile ? 'Profile Sendiri' : 'Kirim Pesanan'}
                  </button>
                  <Link to={user ? '/dashboard/client/messages' : '/login'} className="w-full flex items-center justify-center gap-2 border border-[#888888] text-white rounded-lg py-3 hover:border-[#F5C800] hover:text-[#F5C800] transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
