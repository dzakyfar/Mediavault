import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Pencil, Camera, FolderOpen, Star, Image, Shield, Zap, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiRequest } from '../lib/api';

interface Freelancer {
  id: string;
  name: string;
  specialty: string;
  rating: string | null;
  price: string;
  available: boolean;
}

export default function LandingPage() {
  const [topFreelancers, setTopFreelancers] = useState<Freelancer[]>([]);

  useEffect(() => {
    apiRequest<{ freelancers: Freelancer[] }>('/freelancers', { auth: false })
      .then((response) => setTopFreelancers(response.freelancers.slice(0, 4)))
      .catch(() => setTopFreelancers([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-6 gap-4 h-full p-8">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            <span className="px-4 py-2 border border-[#F5C800] bg-[#141414] rounded-full text-sm">
              4.9 Rating
            </span>
            <span className="px-4 py-2 border border-[#F5C800] bg-[#141414] rounded-full text-sm">
              500+ Freelancers
            </span>
            <span className="px-4 py-2 border border-[#F5C800] bg-[#141414] rounded-full text-sm">
              2,000+ Projects Done
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif', lineHeight: '1.1' }}>
            BOOK THE <span className="text-[#F5C800]">BEST.</span>
            <br />
            SHOOT THE <span className="text-[#F5C800]">REST.</span>
          </h1>
          <p className="text-lg text-[#888888] mb-8 max-w-2xl mx-auto">
            Indonesia's boldest platform for creative photography & video services.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/explore" className="px-8 py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
              Find a Photographer
            </Link>
            <Link to="/register?role=freelancer" className="px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-black transition-all">
              Become a Freelancer
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl text-center mb-16" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Simple. Fast. No Cap.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Pencil, step: '1', title: 'Post Your Job', desc: 'Drop your brief. Set your budget. Get ready for the pitch.' },
              { icon: Camera, step: '2', title: 'Pick Your Shooter', desc: 'Review portfolios, compare rates, and hire the perfect match.' },
              { icon: FolderOpen, step: '3', title: 'Get Your Files', desc: 'Secure payment. Fast delivery. High-res results via NAS.' }
            ].map((item, i) => (
              <div key={i} className="bg-[#141414] rounded-xl p-8 border border-[#2A2A2A] hover:-translate-y-1 hover:border-b-4 hover:border-b-[#F5C800] hover:shadow-[0_4px_20px_rgba(245,200,0,0.2)] transition-all duration-200 relative overflow-hidden">
                <div className="absolute top-8 right-8 text-8xl font-bold text-[#1A1A1A] opacity-50">
                  {item.step}
                </div>
                <item.icon className="w-12 h-12 text-[#F5C800] mb-4 relative z-10" />
                <h3 className="text-2xl font-bold mb-3 relative z-10" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {item.title}
                </h3>
                <p className="text-[#888888] relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-freelancers" className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl mb-16" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Join 500+ Shooters Making Money on MediaVault
          </h2>
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {[
              { icon: Image, title: 'Build Your Portfolio', desc: 'Showcase your best work and get discovered by clients.' },
              { icon: Zap, title: 'Get Hired Fast', desc: 'Connect with clients looking for your exact skills.' },
              { icon: Shield, title: 'Secure Payments', desc: 'Get paid on time, every time. Protected by escrow.' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F5C800] rounded-lg mb-4">
                  <item.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-[#888888]">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/register?role=freelancer" className="inline-block px-8 py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
            Start Earning Today
          </Link>
        </div>
      </section>

      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-5xl md:text-6xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Top Shooters This Week
            </h2>
            <Link to="/explore" className="text-[#F5C800] hover:underline font-bold">See All</Link>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {topFreelancers.length === 0 && (
              <div className="md:col-span-4 bg-[#141414] border border-[#2A2A2A] rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold mb-2">Belum ada freelancer dari database</h3>
                <p className="text-[#888888]">Profil freelancer nyata akan tampil di sini setelah user mendaftar dan memilih role freelancer.</p>
              </div>
            )}

            {topFreelancers.map((freelancer) => (
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
                <h3 className="font-bold mb-2">{freelancer.name}</h3>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {freelancer.specialty.split(' | ').map((tag, j) => (
                    <span key={j} className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mb-2 text-sm">
                  <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                  <span>{freelancer.rating ?? 'Baru'}</span>
                </div>
                <p className="text-[#F5C800] font-bold mb-4">From {freelancer.price}</p>
                <Link to={`/freelancer/${freelancer.id}`} className="block w-full px-4 py-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors text-center">
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl mb-12 text-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            What Do You Need Shot?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Wedding' },
              { name: 'Product' },
              { name: 'Fashion' },
              { name: 'Corporate' },
              { name: 'Concert' },
              { name: 'Real Estate' }
            ].map((category, i) => (
              <Link
                key={i}
                to={`/explore?category=${category.name.toLowerCase()}`}
                className="relative h-64 rounded-xl overflow-hidden group cursor-pointer block"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20"></div>
                <div className="absolute inset-0 bg-[#1A1A1A] group-hover:scale-105 transition-transform duration-300"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
                  <h3 className="text-3xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {category.name}
                  </h3>
                  <span className="px-3 py-1 bg-[#F5C800] text-black text-sm font-bold rounded-full">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#888888]">
            Testimonial nyata akan ditampilkan setelah data review tersedia di database.
          </p>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
